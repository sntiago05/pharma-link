import * as pharmacyApi from "../../services/pharmacy.js";
import { listNotifications, markAllAsRead } from "../../services/notifications.js";
import { loadContext } from "../../services/auth.js";
import { getContext } from "../../services/session.js";
import {
  dataTable,
  emptyState,
  errorState,
  escapeHtml,
  formatDate,
  formatTime,
  loadingState,
  panel,
  primaryButton,
  roleShell,
  secondaryButton,
  selectField,
  statCard,
  statusBadge,
  statusLabel,
  statusTone,
  textField,
  toast
} from "../components.js";

import { bindLogout, quickLinks, sectionFromPath, userCard } from "../shell.js";

/**
 * Pharmacy panel.
 *
 * Every call is scoped to the pharmacy the operator is assigned to via
 * `user_pharmacies`; that id comes from `GET /api/me`, not from the URL, so the
 * UI cannot even ask for another pharmacy's data.
 */

const SECTIONS = ["dashboard", "inventory", "branches", "requests", "reservations", "deliveries", "notifications", "profile"];
const ADMIN_PHARMACY_KEY = "pharmaLink.adminPharmacyId";

const appendPharmacyId = (path, pharmacyId) => {
  if (!pharmacyId) return path;

  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("pharmacyId", pharmacyId);
  return `${pathname}?${params.toString()}`;
};

const NAV = (active, pharmacyId) => [
  { label: "Dashboard", href: appendPharmacyId("/pharmacy/dashboard", pharmacyId), active: active === "dashboard" },
  { label: "Inventario", href: appendPharmacyId("/pharmacy/inventory", pharmacyId), active: active === "inventory" },
  { label: "Sedes", href: appendPharmacyId("/pharmacy/branches", pharmacyId), active: active === "branches" },
  { label: "Peticiones", href: appendPharmacyId("/pharmacy/requests", pharmacyId), active: active === "requests" },
  { label: "Reservas", href: appendPharmacyId("/pharmacy/reservations", pharmacyId), active: active === "reservations" },
  { label: "Entregas", href: appendPharmacyId("/pharmacy/deliveries", pharmacyId), active: active === "deliveries" },
  { label: "Notificaciones", href: appendPharmacyId("/pharmacy/notifications", pharmacyId), active: active === "notifications" },
  { label: "Perfil", href: appendPharmacyId("/pharmacy/profile", pharmacyId), active: active === "profile" }
];

const todayIso = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

function paint({ user, section, body, pharmacyId }) {
  const adminBackLink =
    user.role === "ADMIN"
      ? `
        <a href="/admin/dashboard" class="mt-4 flex items-center gap-2 rounded-[20px] border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-[#0D4D44] transition hover:bg-emerald-50">
          <span aria-hidden="true">←</span> Volver al panel admin
        </a>
      `
      : "";

  document.getElementById("app").innerHTML = roleShell({
    title: "Panel de la farmacia",
    subtitle: "Gestiona inventario, reservas y entregas.",
    navItems: NAV(section, pharmacyId),
    content: `<div id="pharmacyContent">${body}</div>`,
    sideContent: `
      ${userCard({ user })}
      ${adminBackLink}
      ${quickLinks([
        { label: "Reservas de hoy", href: appendPharmacyId("/pharmacy/reservations", pharmacyId) },
        { label: "Confirmar entregas", href: appendPharmacyId("/pharmacy/deliveries", pharmacyId) },
        { label: "Ajustar inventario", href: appendPharmacyId("/pharmacy/inventory", pharmacyId) }
      ], { dashboardHref: appendPharmacyId("/pharmacy/dashboard", pharmacyId) })}
    `
  });
}

const setContent = (html) => {
  const node = document.getElementById("pharmacyContent");
  if (node) node.innerHTML = html;
};

/** An operator with no `user_pharmacies` row cannot query anything. */
const noPharmacy = () => `
  <div class="mt-5 rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-center">
    <p class="text-base font-semibold text-amber-900">Tu usuario no está asignado a una farmacia</p>
    <p class="mx-auto mt-2 max-w-md text-sm text-amber-800">
      Un administrador debe vincular tu cuenta a una farmacia para que puedas gestionar inventario y entregas.
    </p>
  </div>
`;

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

async function renderDashboard({ context, pharmacyId }) {
  setContent(loadingState("Cargando estadísticas..."));

  const data = await pharmacyApi.getDashboard(pharmacyId);

  const alerts = data.stockAlerts.length
    ? dataTable({
        headers: ["Medicamento", "Código", "Stock", "Reservado", "Disponible", "Estado"],
        rows: data.stockAlerts.map((alert) => [
          escapeHtml(alert.name),
          escapeHtml(alert.code),
          String(alert.stockQuantity),
          String(alert.reservedQuantity),
          String(alert.availableQuantity),
          statusBadge(
            alert.alert === "OUT_OF_STOCK" ? "Agotado" : "Stock bajo",
            alert.alert === "OUT_OF_STOCK" ? "red" : "amber"
          )
        ])
      })
    : emptyState("Sin alertas de inventario.", "Todo el stock está por encima del umbral.");

  setContent(`
    <div class="mt-5 grid gap-3 md:grid-cols-3">
      ${statCard("Reservas pendientes", String(data.reservations.pending), "Por atender")}
      ${statCard("Reservas hoy", String(data.reservations.today), `${data.reservations.pendingToday} activas`)}
      ${statCard("Entregas hoy", String(data.deliveries.today), `${data.deliveries.total} en total`)}
    </div>

    <div class="mt-3 grid gap-3 md:grid-cols-3">
      ${statCard("Cancelaciones", String(data.reservations.cancellations), `${data.reservations.noShows} no asistieron`)}
      ${statCard("Inventario bajo", String(data.inventory.lowStock), `Umbral: ${data.lowStockThreshold} und.`)}
      ${statCard("Agotados", String(data.inventory.outOfStock), `${data.inventory.trackedMedicines} medicamentos`)}
    </div>

    ${panel({
      title: "Alertas de inventario",
      action: `<a href="${appendPharmacyId("/pharmacy/inventory", context.pharmacy?.id ? null : pharmacyId)}" class="text-sm font-medium text-emerald-700">Gestionar</a>`,
      body: alerts
    })}
  `);
}

/* -------------------------------------------------------------------------- */
/* Inventory                                                                   */
/* -------------------------------------------------------------------------- */

async function renderInventory(ctx) {
  const { pharmacyId } = ctx;
  setContent(loadingState("Cargando inventario..."));

  const branches = await pharmacyApi.listBranches(pharmacyId);
  if (branches.length) {
    const branchInventories = await Promise.all(
      branches.map(async (branch) => ({ branch, inventory: await pharmacyApi.listInventory(branch.id) }))
    );
    setContent(
      branchInventories
        .map(({ branch, inventory }) =>
          panel({
            title: `Inventario de ${escapeHtml(branch.name)}`,
            action: statusBadge(branch.active ? "Sede activa" : "Sede inactiva", branch.active ? "emerald" : "red"),
            body: inventory.length
              ? dataTable({
                  headers: ["Código", "Medicamento", "Stock", "Reservado", "Disponible", "Alerta"],
                  rows: inventory.map((item) => {
                    const lowStock = item.available_quantity <= 10;
                    return [
                      escapeHtml(item.code), escapeHtml(item.name), String(item.stock_quantity),
                      String(item.reserved_quantity), String(item.available_quantity),
                      lowStock ? statusBadge("Stock bajo", "amber") : statusBadge("Normal", "emerald")
                    ];
                  })
                })
              : emptyState("Esta sede no tiene inventario cargado.")
          })
        )
        .join("")
    );
    return;
  }

  const [inventory, medicines] = await Promise.all([
    pharmacyApi.listInventory(pharmacyId),
    pharmacyApi.listMedicines()
  ]);

  setContent(`
    ${panel({
      title: "Registrar entrada o ajuste",
      body: `
        <form id="adjustForm" class="grid gap-3 md:grid-cols-3" novalidate>
          ${selectField({
            id: "medicineId",
            label: "Medicamento",
            options: medicines.map((medicine) => ({
              value: medicine.id,
              label: `${medicine.code} — ${medicine.name}`
            }))
          })}
          ${textField({ id: "quantity", label: "Cantidad (+ entra, − sale)", type: "number", placeholder: "50" })}
          ${selectField({
            id: "movementType",
            label: "Tipo",
            value: "ADJUSTMENT",
            placeholder: "",
            options: [
              { value: "IN", label: "Entrada de mercancía" },
              { value: "ADJUSTMENT", label: "Ajuste de inventario" }
            ]
          })}
          <div class="md:col-span-3">
            <p id="adjustError" class="min-h-5 text-sm font-medium text-red-600"></p>
            ${primaryButton("Aplicar movimiento", { type: "submit" })}
          </div>
        </form>
      `
    })}

    ${panel({
      title: "Inventario actual",
      body: inventory.length
        ? dataTable({
            headers: ["Código", "Medicamento", "Stock", "Reservado", "Disponible"],
            rows: inventory.map((item) => [
              escapeHtml(item.code),
              escapeHtml(item.name),
              String(item.stock_quantity),
              String(item.reserved_quantity),
              `<span class="font-semibold ${item.available_quantity === 0 ? "text-red-600" : "text-emerald-700"}">${item.available_quantity}</span>`
            ])
          })
        : emptyState("Esta farmacia no tiene inventario cargado.", "Registra una entrada para empezar.")
    })}
  `);

  document.getElementById("adjustForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const errorNode = document.getElementById("adjustError");
    const medicineId = document.getElementById("medicineId").value;
    const quantity = Number(document.getElementById("quantity").value);
    errorNode.textContent = "";

    if (!medicineId) {
      errorNode.textContent = "Selecciona un medicamento.";
      return;
    }
    if (!Number.isInteger(quantity) || quantity === 0) {
      errorNode.textContent = "La cantidad debe ser un entero distinto de cero.";
      return;
    }

    try {
      await pharmacyApi.adjustInventory(pharmacyId, {
        medicineId: Number(medicineId),
        quantity,
        movementType: document.getElementById("movementType").value || "ADJUSTMENT"
      });
      toast("Inventario actualizado.");
      await renderInventory(ctx);
    } catch (error) {
      // e.g. "Adjustment would make stock lower than reserved quantity."
      errorNode.textContent = error.detail || error.message;
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Reservations                                                                */
/* -------------------------------------------------------------------------- */

async function renderReservations(ctx) {
  const { pharmacyId } = ctx;
  const params = new URLSearchParams(window.location.search);
  const dateFilter = params.get("date") || "";
  const statusFilter = params.get("status") || "";

  setContent(loadingState("Cargando reservas..."));

  const branches = await pharmacyApi.listBranches(pharmacyId);
  if (branches.length) {
    const histories = await Promise.all(
      branches.map(async (branch) => ({
        branch,
        reservations: await pharmacyApi.listReservations(branch.id, { date: dateFilter, status: statusFilter, limit: 100 })
      }))
    );
    setContent(
      histories
        .map(({ branch, reservations }) =>
          panel({
            title: `Reservas — ${escapeHtml(branch.name)}`,
            action: statusBadge(`${reservations.length} registro(s)`, "slate"),
            body: reservations.length
              ? dataTable({
                  headers: ["Fecha", "Hora", "Paciente", "Documento", "Orden", "Estado"],
                  rows: reservations.map((reservation) => [
                    formatDate(reservation.reservation_date),
                    `${formatTime(reservation.start_time)} - ${formatTime(reservation.end_time)}`,
                    escapeHtml(reservation.patient_name),
                    escapeHtml(reservation.patient_document),
                    escapeHtml(reservation.order_number),
                    statusBadge(statusLabel(reservation.status), statusTone(reservation.status))
                  ])
                })
              : emptyState("Esta sede no tiene reservas.")
          })
        )
        .join("")
    );
    return;
  }

  const reservations = await pharmacyApi.listReservations(pharmacyId, {
    date: dateFilter,
    status: statusFilter,
    limit: 100
  });

  setContent(
    panel({
      title: "Reservas de la farmacia",
      action: `
        <div class="flex flex-wrap items-center gap-2">
          <input id="filterDate" type="date" value="${dateFilter}"
            class="rounded-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-600">
          <select id="filterStatus" class="rounded-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-600">
            <option value="">Todos los estados</option>
            ${["RESERVED", "COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED"]
              .map(
                (status) =>
                  `<option value="${status}" ${status === statusFilter ? "selected" : ""}>${statusLabel(status)}</option>`
              )
              .join("")}
          </select>
        </div>
      `,
      body: reservations.length
        ? dataTable({
            headers: ["Fecha", "Hora", "Paciente", "Documento", "Orden", "Estado"],
            rows: reservations.map((reservation) => [
              formatDate(reservation.reservation_date),
              `${formatTime(reservation.start_time)} - ${formatTime(reservation.end_time)}`,
              escapeHtml(reservation.patient_name),
              escapeHtml(reservation.patient_document),
              escapeHtml(reservation.order_number),
              statusBadge(statusLabel(reservation.status), statusTone(reservation.status))
            ])
          })
        : emptyState("No hay reservas con esos filtros.")
    })
  );

  const applyFilters = () => {
    const query = new URLSearchParams();
    const date = document.getElementById("filterDate").value;
    const status = document.getElementById("filterStatus").value;
    if (!ctx.context.pharmacy?.id) query.set("pharmacyId", pharmacyId);
    if (date) query.set("date", date);
    if (status) query.set("status", status);
    ctx.navigate(`/pharmacy/reservations${query.toString() ? `?${query}` : ""}`);
  };

  document.getElementById("filterDate").addEventListener("change", applyFilters);
  document.getElementById("filterStatus").addEventListener("change", applyFilters);
}

/* -------------------------------------------------------------------------- */
/* Deliveries                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Active reservations, ready to hand over.
 *
 * Only `RESERVED` rows are listed: those are the only ones the delivery and
 * no-show endpoints accept.
 */
async function renderDeliveries(ctx) {
  const { pharmacyId } = ctx;
  setContent(loadingState("Cargando entregas pendientes..."));

  const reservations = await pharmacyApi.listReservations(pharmacyId, {
    status: "RESERVED",
    limit: 100
  });

  setContent(
    panel({
      title: "Entregas pendientes",
      action: `<span class="text-sm text-slate-400">${reservations.length} por atender</span>`,
      body: reservations.length
        ? reservations
            .map(
              (reservation) => `
              <article class="mb-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p class="text-sm font-semibold text-slate-900">${escapeHtml(reservation.patient_name)}</p>
                    <p class="text-xs text-slate-400">
                      Doc. ${escapeHtml(reservation.patient_document)} · Orden ${escapeHtml(reservation.order_number)}
                    </p>
                  </div>
                  ${statusBadge(`${formatDate(reservation.reservation_date)} ${formatTime(reservation.start_time)}`, "slate")}
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  ${primaryButton("Confirmar entrega", { attrs: `data-deliver="${reservation.id}"` })}
                  ${secondaryButton("No asistió", { tone: "red", attrs: `data-noshow="${reservation.id}"` })}
                </div>
              </article>`
            )
            .join("")
        : emptyState("No hay entregas pendientes.", "Las reservas activas aparecerán aquí.")
    })
  );

  document.querySelectorAll("[data-deliver]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await pharmacyApi.confirmDelivery(button.dataset.deliver);
        toast("Entrega confirmada. Inventario descontado.");
        await renderDeliveries(ctx);
      } catch (error) {
        toast(error.detail || error.message, "red");
        button.disabled = false;
      }
    });
  });

  document.querySelectorAll("[data-noshow]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("¿Marcar como no asistida? Se liberará el stock reservado.")) return;

      button.disabled = true;
      try {
        await pharmacyApi.markNoShow(button.dataset.noshow);
        toast("Reserva marcada como no asistida.");
        await renderDeliveries(ctx);
      } catch (error) {
        toast(error.detail || error.message, "red");
        button.disabled = false;
      }
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                               */
/* -------------------------------------------------------------------------- */

async function renderNotificationsSection(ctx) {
  setContent(loadingState("Cargando notificaciones..."));

  const notifications = await listNotifications({ limit: 50 });

  setContent(
    panel({
      title: "Notificaciones",
      action: notifications.some((notification) => !notification.read_at)
        ? secondaryButton("Marcar todas como leídas", { attrs: "data-read-all" })
        : "",
      body: notifications.length
        ? notifications
            .map(
              (notification) => `
              <article class="mb-2 rounded-[20px] border ${notification.read_at ? "border-slate-200 bg-white" : "border-emerald-200 bg-emerald-50"} p-4">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="text-sm font-semibold text-slate-900">${escapeHtml(notification.title)}</p>
                  <span class="text-xs text-slate-400">${formatDate(notification.created_at)}</span>
                </div>
                <p class="mt-1 text-sm text-slate-600">${escapeHtml(notification.message)}</p>
              </article>`
            )
            .join("")
        : emptyState("No tienes notificaciones.")
    })
  );

  document.querySelector("[data-read-all]")?.addEventListener("click", async () => {
    await markAllAsRead();
    await renderNotificationsSection(ctx);
  });
}

/* -------------------------------------------------------------------------- */
/* Profile / working hours                                                     */
/* -------------------------------------------------------------------------- */

async function renderBranches({ pharmacyId }) {
  setContent(loadingState("Cargando sedes..."));
  const branches = await pharmacyApi.listBranches(pharmacyId);
  setContent(`
    ${panel({ title: "Agregar sede", body: `
      <form id="branchForm" class="grid gap-3 md:grid-cols-2" novalidate>
        ${textField({ id: "branchName", label: "Nombre", type: "text" })}
        ${textField({ id: "branchNit", label: "NIT", type: "text" })}
        ${textField({ id: "branchAddress", label: "Dirección", type: "text" })}
        ${textField({ id: "branchCity", label: "Ciudad", type: "text" })}
        ${textField({ id: "branchOpening", label: "Hora de apertura", type: "time", value: "08:00" })}
        ${textField({ id: "branchClosing", label: "Hora de cierre", type: "time", value: "17:00" })}
        ${textField({ id: "branchDuration", label: "Duración de bloque (min)", type: "number", value: "30", min: "5" })}
        ${textField({ id: "branchCapacity", label: "Capacidad por bloque", type: "number", value: "3", min: "1" })}
        <div class="md:col-span-2"><p id="branchError" class="min-h-5 text-sm text-red-600"></p>${primaryButton("Crear sede", { type: "submit" })}</div>
      </form>` })}
    ${panel({ title: "Sedes existentes", body: branches.length ? dataTable({
      headers: ["Sede", "Ciudad", "Dirección", "Estado", "Acciones"],
      rows: branches.map((branch) => [escapeHtml(branch.name), escapeHtml(branch.city), escapeHtml(branch.address), statusBadge(branch.active ? "Activa" : "Inactiva", branch.active ? "emerald" : "red"), `<div class="flex gap-2">${secondaryButton(branch.active ? "Solicitar desactivación" : "Solicitar activación", { attrs: `${branch.active ? "data-deactivate-branch" : "data-activate-branch"}="${branch.id}"` })}${secondaryButton("Solicitar eliminación", { tone: "red", attrs: `data-delete-branch-request="${branch.id}"` })}</div>`])
    }) : emptyState("No hay sedes registradas.") })}
  `);
  document.getElementById("branchForm").addEventListener("submit", async (event) => {
    event.preventDefault(); const error = document.getElementById("branchError"); error.textContent = "";
    try { await pharmacyApi.createBranch(pharmacyId, { name: branchName.value.trim(), nit: branchNit.value.trim(), address: branchAddress.value.trim(), city: branchCity.value.trim(), openingTime: branchOpening.value, closingTime: branchClosing.value, slotDuration: Number(branchDuration.value), capacityPerSlot: Number(branchCapacity.value) }); toast("Sede creada."); await renderBranches({ pharmacyId }); } catch (e) { error.textContent = e.detail || e.message; }
  });
  const bindChangeRequest = (selector, action, datasetKey) => {
    document.querySelectorAll(selector).forEach((button) => button.addEventListener("click", async () => {
      try { await pharmacyApi.requestBranchChange(pharmacyId, button.dataset[datasetKey], action); toast("Solicitud enviada al administrador."); } catch (e) { toast(e.detail || e.message, "red"); }
    }));
  };
  bindChangeRequest("[data-deactivate-branch]", "DEACTIVATE", "deactivateBranch");
  bindChangeRequest("[data-activate-branch]", "ACTIVATE", "activateBranch");
  bindChangeRequest("[data-delete-branch-request]", "DELETE", "deleteBranchRequest");
}

async function renderRequests() {
  setContent(loadingState("Cargando peticiones..."));
  const requests = await pharmacyApi.listMyBranchChangeRequests();
  setContent(panel({ title: "Mis peticiones", body: requests.length ? dataTable({
    headers: ["Sede", "Acción", "Hora de envío", "Estado", "Hora de respuesta"],
    rows: requests.map((request) => [escapeHtml(request.branch_name), escapeHtml(request.action), formatDate(request.created_at), statusBadge(request.status, request.status === "PENDING" ? "amber" : request.status === "APPROVED" ? "emerald" : "red"), request.reviewed_at ? formatDate(request.reviewed_at) : "-"])
  }) : emptyState("No has enviado peticiones.") }));
}

/**
 * Working hours define the slot grid patients book against, so this form is the
 * pharmacy's most consequential setting: `slotDuration` and `capacityPerSlot`
 * decide how many appointments exist per day.
 */
async function renderProfileSection(ctx) {
  const { user, context, pharmacyId } = ctx;
  setContent(loadingState("Cargando datos..."));

  const pharmacies = await pharmacyApi.listInventory(pharmacyId).catch(() => []);

  setContent(`
    ${panel({
      title: "Datos de la farmacia",
      body: `
        <div class="space-y-3">
          ${[
            ["Farmacia", context.pharmacy?.name],
            ["Ciudad", context.pharmacy?.city],
            ["Operador", user.fullName],
            ["Correo", user.email],
            ["Medicamentos en inventario", String(pharmacies.length)]
          ]
            .map(
              ([label, value]) => `
              <div class="rounded-[20px] bg-slate-50 p-4">
                <p class="text-sm text-slate-500">${label}</p>
                <p class="mt-1 text-base font-semibold text-slate-900">${escapeHtml(value || "-")}</p>
              </div>`
            )
            .join("")}
        </div>
      `
    })}

    ${panel({
      title: "Horario de atención y capacidad",
      body: `
        <p class="mb-4 text-sm text-slate-500">
          Define los bloques de cita. Con apertura 08:00, duración 30 y capacidad 3,
          se generan turnos de 08:00, 08:30... y cada uno acepta 3 reservas.
        </p>
        <form id="hoursForm" class="grid gap-3 md:grid-cols-2" novalidate>
          ${textField({ id: "openingTime", label: "Hora de apertura", type: "time", value: "08:00" })}
          ${textField({ id: "closingTime", label: "Hora de cierre", type: "time", value: "17:00" })}
          ${textField({ id: "slotDuration", label: "Duración del bloque (min)", type: "number", value: "30", min: "5" })}
          ${textField({ id: "capacityPerSlot", label: "Capacidad por bloque", type: "number", value: "3", min: "1" })}
          <div class="md:col-span-2">
            <p id="hoursError" class="min-h-5 text-sm font-medium text-red-600"></p>
            ${primaryButton("Guardar horario", { type: "submit" })}
          </div>
        </form>
      `
    })}
  `);

  document.getElementById("hoursForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const errorNode = document.getElementById("hoursError");
    errorNode.textContent = "";

    try {
      await pharmacyApi.setWorkingHours({
        pharmacyId,
        openingTime: document.getElementById("openingTime").value,
        closingTime: document.getElementById("closingTime").value,
        slotDuration: Number(document.getElementById("slotDuration").value),
        capacityPerSlot: Number(document.getElementById("capacityPerSlot").value)
      });
      toast("Horario actualizado.");
    } catch (error) {
      errorNode.textContent = error.detail || error.message;
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                 */
/* -------------------------------------------------------------------------- */

const RENDERERS = {
  dashboard: renderDashboard,
  inventory: renderInventory,
  branches: renderBranches,
  requests: renderRequests,
  reservations: renderReservations,
  deliveries: renderDeliveries,
  notifications: renderNotificationsSection,
  profile: renderProfileSection
};

export async function renderPharmacyDashboard({ navigate, user, currentPath }) {
  const section = sectionFromPath(currentPath, SECTIONS, "dashboard");
  const urlPharmacyId = Number(new URLSearchParams(window.location.search).get("pharmacyId"));
  const storedPharmacyId = Number(window.sessionStorage.getItem(ADMIN_PHARMACY_KEY));
  const initialPharmacyId = urlPharmacyId || (user.role === "ADMIN" ? storedPharmacyId : null);

  paint({ user, section, body: loadingState(), pharmacyId: initialPharmacyId });
  bindLogout(navigate);

  let context = getContext();
  if (!context || context.role !== user.role) {
    try {
      context = await loadContext();
    } catch (error) {
      setContent(errorState(error.detail || error.message));
      return;
    }
  }

  // ADMIN may open this panel; it has no user_pharmacies row, so it is pointed
  // at the pharmacy in the URL (?pharmacyId=) or the first one it manages.
  const pharmacyId =
    context.pharmacy?.id || urlPharmacyId || (user.role === "ADMIN" ? storedPharmacyId : null);

  if (!pharmacyId) {
    setContent(
      user.role === "ADMIN"
        ? errorState("Indica la farmacia con ?pharmacyId=1 en la URL.", { retry: false })
        : noPharmacy()
    );
    return;
  }

  if (!context.pharmacy?.id) {
    window.sessionStorage.setItem(ADMIN_PHARMACY_KEY, String(pharmacyId));
    if (!urlPharmacyId) {
      navigate(appendPharmacyId(currentPath, pharmacyId), { replace: true });
      return;
    }
  }

  paint({ user, section, body: loadingState(), pharmacyId: context.pharmacy?.id ? null : pharmacyId });
  bindLogout(navigate);

  try {
    await RENDERERS[section]({ navigate, user, currentPath, context, pharmacyId });
  } catch (error) {
    if (error?.status === 401) throw error;
    setContent(errorState(error.detail || error.message));
    document
      .querySelector("[data-retry]")
      ?.addEventListener("click", () => renderPharmacyDashboard({ navigate, user, currentPath }));
  }
}
