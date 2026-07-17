import * as epsApi from "../../services/eps.js";
import { listNotifications } from "../../services/notifications.js";
import { loadContext } from "../../services/auth.js";
import { getContext } from "../../services/session.js";
import {
  dataTable,
  emptyState,
  errorState,
  escapeHtml,
  formatDate,
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
 * EPS panel.
 *
 * The EPS is the origin of the flow: it issues the medical orders that patients
 * then reserve. Scoped to the operator's own EPS via `user_eps`.
 */

const SECTIONS = ["dashboard", "orders", "create", "profile"];

const NAV = (active) => [
  { label: "Dashboard", href: "/eps/dashboard", active: active === "dashboard" },
  { label: "Órdenes", href: "/eps/orders", active: active === "orders" },
  { label: "Generar orden", href: "/eps/orders/create", active: active === "create" },
  { label: "Perfil", href: "/eps/profile", active: active === "profile" }
];

const todayIso = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/** Default expiry: 30 days out, the usual validity of a prescription. */
const inThirtyDays = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

function paint({ user, section, body }) {
  document.getElementById("app").innerHTML = roleShell({
    title: "Panel de la EPS",
    subtitle: "Genera órdenes médicas y sigue su ciclo hasta la entrega.",
    navItems: NAV(section),
    content: `<div id="epsContent">${body}</div>`,
    sideContent: `
      ${userCard({ user })}
      ${quickLinks([
        { label: "Generar orden médica", href: "/eps/orders/create" },
        { label: "Historial de órdenes", href: "/eps/orders" },
        { label: "Estadísticas", href: "/eps/dashboard" }
      ])}
    `
  });
}

const setContent = (html) => {
  const node = document.getElementById("epsContent");
  if (node) node.innerHTML = html;
};

const noEps = () => `
  <div class="mt-5 rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-center">
    <p class="text-base font-semibold text-amber-900">Tu usuario no está asignado a una EPS</p>
    <p class="mx-auto mt-2 max-w-md text-sm text-amber-800">
      Un administrador debe vincular tu cuenta a una EPS para que puedas generar órdenes.
    </p>
  </div>
`;

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

async function renderDashboard({ epsId }) {
  setContent(loadingState("Cargando estadísticas..."));

  const [data, notifications] = await Promise.all([
    epsApi.getDashboard(epsId),
    listNotifications({ limit: 5 }).catch(() => [])
  ]);

  const breakdown = data.pharmacies.length
    ? dataTable({
        headers: ["Farmacia", "Ciudad", "Entregas", "Reservas activas"],
        rows: data.pharmacies.map((pharmacy) => [
          escapeHtml(pharmacy.name),
          escapeHtml(pharmacy.city || "-"),
          String(pharmacy.deliveries),
          String(pharmacy.activeReservations)
        ])
      })
    : emptyState("No hay farmacias asociadas a esta EPS.");

  setContent(`
    <div class="mt-5 grid gap-3 md:grid-cols-4">
      ${statCard("Órdenes creadas", String(data.orders.created), `${data.orders.createdToday} hoy`)}
      ${statCard("Entregadas", String(data.orders.delivered), "Ciclo completo")}
      ${statCard("Pendientes", String(data.orders.pending), `${data.orders.reserved} reservadas`)}
      ${statCard("Vencidas", String(data.orders.expired), "Sin reclamar")}
    </div>

    <div class="mt-3 grid gap-3 md:grid-cols-2">
      ${statCard("Pacientes atendidos", String(data.patients.served), `de ${data.patients.total} con órdenes`)}
      ${statCard("Canceladas", String(data.orders.cancelled), "Órdenes anuladas")}
    </div>

    ${panel({
      title: "Red de farmacias",
      action: `<a href="/eps/orders" class="text-sm font-medium text-emerald-700">Ver órdenes</a>`,
      body: breakdown
    })}
  `);
}

/* -------------------------------------------------------------------------- */
/* Orders history                                                              */
/* -------------------------------------------------------------------------- */

async function renderOrders(ctx) {
  const { epsId } = ctx;
  const params = new URLSearchParams(window.location.search);
  const statusFilter = params.get("status") || "";
  const search = params.get("search") || "";

  setContent(loadingState("Cargando órdenes..."));

  const orders = await epsApi.listOrders(epsId, { status: statusFilter, search, limit: 100 });

  setContent(
    panel({
      title: "Órdenes emitidas",
      action: `
        <div class="flex flex-wrap items-center gap-2">
          <input id="searchInput" type="search" value="${escapeHtml(search)}" placeholder="Orden, documento o paciente"
            class="rounded-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-600">
          <select id="statusFilter" class="rounded-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-600">
            <option value="">Todos</option>
            ${["PENDING", "RESERVED", "DELIVERED", "CANCELLED", "EXPIRED"]
              .map(
                (status) =>
                  `<option value="${status}" ${status === statusFilter ? "selected" : ""}>${statusLabel(status)}</option>`
              )
              .join("")}
          </select>
          <a href="/eps/orders/create" class="rounded-full bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white">Nueva</a>
        </div>
      `,
      body: orders.length
        ? dataTable({
            headers: ["Orden", "Paciente", "Documento", "Medicamentos", "Emitida", "Vence", "Estado"],
            rows: orders.map((order) => [
              escapeHtml(order.order_number),
              escapeHtml(order.patient_name),
              escapeHtml(order.patient_document),
              escapeHtml(order.items.map((item) => `${item.name} (${item.quantity})`).join(", ")),
              formatDate(order.issue_date),
              formatDate(order.expiration_date),
              statusBadge(statusLabel(order.status), statusTone(order.status))
            ])
          })
        : emptyState("No hay órdenes con esos filtros.", "Genera la primera desde 'Nueva'.")
    })
  );

  const applyFilters = () => {
    const query = new URLSearchParams();
    const status = document.getElementById("statusFilter").value;
    const term = document.getElementById("searchInput").value.trim();
    if (status) query.set("status", status);
    if (term) query.set("search", term);
    ctx.navigate(`/eps/orders${query.toString() ? `?${query}` : ""}`);
  };

  document.getElementById("statusFilter").addEventListener("change", applyFilters);
  document.getElementById("searchInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") applyFilters();
  });
}

/* -------------------------------------------------------------------------- */
/* Create order                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Order form.
 *
 * The patient fields for a new enrolment stay hidden until the API says the
 * document is unknown (422): asking for a name and email up front would be noise
 * for the common case of a patient the EPS already sent before.
 */
async function renderCreate(ctx) {
  const { epsId, navigate } = ctx;
  setContent(loadingState("Cargando medicamentos..."));

  const medicines = await epsApi.listMedicines();

  if (!medicines.length) {
    setContent(
      panel({
        title: "Generar orden médica",
        body: emptyState("No hay medicamentos en el catálogo.", "Un administrador debe registrarlos primero.")
      })
    );
    return;
  }

  const medicineOptions = medicines.map((medicine) => ({
    value: medicine.id,
    label: `${medicine.code} — ${medicine.name}`
  }));

  setContent(
    panel({
      title: "Generar orden médica",
      body: `
        <form id="orderForm" class="space-y-4" novalidate>
          <div class="grid gap-3 md:grid-cols-2">
            <div class="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">El número de orden se asigna automáticamente al crearla.</div>
            ${textField({ id: "patientDocument", label: "Documento del paciente", placeholder: "1020304050" })}
            ${textField({ id: "issueDate", label: "Fecha de emisión", type: "date", value: todayIso() })}
            ${textField({ id: "expirationDate", label: "Fecha de vencimiento", type: "date", value: inThirtyDays() })}
          </div>

          <div id="newPatientFields" class="hidden rounded-[20px] border border-amber-200 bg-amber-50 p-4">
            <p class="mb-3 text-sm font-semibold text-amber-900">Paciente nuevo: completa sus datos para afiliarlo</p>
            <div class="grid gap-3 md:grid-cols-2">
              ${textField({ id: "patientFullName", label: "Nombre completo", required: false })}
              ${textField({ id: "patientEmail", label: "Correo", type: "email", required: false })}
              ${textField({ id: "patientPhone", label: "Teléfono (opcional)", type: "tel", required: false })}
            </div>
          </div>

          <div>
            <p class="mb-2 text-sm font-semibold text-slate-700">Medicamentos</p>
            <div id="itemsList" class="space-y-2"></div>
            <div class="mt-2">${secondaryButton("+ Agregar medicamento", { attrs: "data-add-item" })}</div>
          </div>

          <p id="orderError" class="min-h-5 text-sm font-medium text-red-600"></p>
          ${primaryButton("Generar orden", { type: "submit", full: true })}
        </form>
      `
    })
  );

  const minimumOrderDate = todayIso();
  document.getElementById("issueDate").min = minimumOrderDate;
  document.getElementById("expirationDate").min = minimumOrderDate;

  const itemsList = document.getElementById("itemsList");

  const addItemRow = () => {
    const row = document.createElement("div");
    row.className = "grid grid-cols-[1fr_100px_auto] items-end gap-2";
    row.innerHTML = `
      ${selectField({ id: `medicine-${Date.now()}`, label: "Medicamento", options: medicineOptions })}
      ${textField({ id: `qty-${Date.now()}`, label: "Cantidad", type: "number", value: "1", min: "1" })}
      ${secondaryButton("✕", { tone: "red", attrs: "data-remove-item" })}
    `;
    itemsList.appendChild(row);

    row.querySelector("[data-remove-item]").addEventListener("click", () => {
      // Always keep one row: an order with no medicines is rejected by the API.
      if (itemsList.children.length > 1) row.remove();
    });
  };

  addItemRow();
  document.querySelector("[data-add-item]").addEventListener("click", addItemRow);

  document.getElementById("orderForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const errorNode = document.getElementById("orderError");
    errorNode.textContent = "";

    const details = [...itemsList.children]
      .map((row) => ({
        medicineId: Number(row.querySelector("select").value),
        quantity: Number(row.querySelector("input").value)
      }))
      .filter((detail) => detail.medicineId && detail.quantity > 0);

    if (!details.length) {
      errorNode.textContent = "Agrega al menos un medicamento con cantidad válida.";
      return;
    }

    const issueDate = document.getElementById("issueDate").value;
    const expirationDate = document.getElementById("expirationDate").value;
    if (issueDate < minimumOrderDate) {
      errorNode.textContent = "La fecha de emisi\u00f3n no puede ser anterior a hoy.";
      return;
    }
    if (expirationDate < minimumOrderDate) {
      errorNode.textContent = "La fecha de vencimiento no puede ser anterior a hoy.";
      return;
    }
    if (expirationDate < issueDate) {
      errorNode.textContent = "La fecha de vencimiento debe ser igual o posterior a la emisi\u00f3n.";
      return;
    }

    const submitButton = event.target.querySelector("button[type=submit]");
    submitButton.disabled = true;
    submitButton.textContent = "Generando...";

    const payload = {
      patientDocument: document.getElementById("patientDocument").value.trim(),
      issueDate,
      expirationDate,
      details
    };

    const fullName = document.getElementById("patientFullName").value.trim();
    const email = document.getElementById("patientEmail").value.trim();
    const phone = document.getElementById("patientPhone").value.trim();
    if (fullName) payload.patientFullName = fullName;
    if (email) payload.patientEmail = email;
    if (phone) payload.patientPhone = phone;

    try {
      await epsApi.createOrder(epsId, payload);
      toast("Orden generada correctamente.");
      navigate("/eps/orders");
    } catch (error) {
      submitButton.disabled = false;
      submitButton.textContent = "Generar orden";

      // 422 with an unknown document means the patient must be enrolled first.
      if (error.status === 422 && /not enrolled/i.test(error.message)) {
        document.getElementById("newPatientFields").classList.remove("hidden");
        errorNode.textContent = "Este documento no está afiliado. Completa los datos del paciente.";
        return;
      }

      errorNode.textContent = error.detail || error.message;
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                     */
/* -------------------------------------------------------------------------- */

async function renderProfileSection({ user, context }) {
  setContent(
    panel({
      title: "Datos de la EPS",
      body: `
        <div class="space-y-3">
          ${[
            ["EPS", context.eps?.name],
            ["NIT", context.eps?.nit],
            ["Operador", user.fullName],
            ["Correo", user.email]
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
    })
  );
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                 */
/* -------------------------------------------------------------------------- */

const RENDERERS = {
  dashboard: renderDashboard,
  orders: renderOrders,
  create: renderCreate,
  profile: renderProfileSection
};

export async function renderEpsDashboard({ navigate, user, currentPath }) {
  // "/eps/orders/create" ends in "create"; "/eps/orders" in "orders".
  const section = sectionFromPath(currentPath, SECTIONS, "dashboard");

  paint({ user, section, body: loadingState() });
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

  // ADMIN has no user_eps row; it targets an EPS with ?epsId= in the URL.
  const epsId = context.eps?.id || Number(new URLSearchParams(window.location.search).get("epsId"));

  if (!epsId) {
    setContent(
      user.role === "ADMIN"
        ? errorState("Indica la EPS con ?epsId=1 en la URL.", { retry: false })
        : noEps()
    );
    return;
  }

  try {
    await RENDERERS[section]({ navigate, user, currentPath, context, epsId });
  } catch (error) {
    if (error?.status === 401) throw error;
    setContent(errorState(error.detail || error.message));
    document
      .querySelector("[data-retry]")
      ?.addEventListener("click", () => renderEpsDashboard({ navigate, user, currentPath }));
  }
}
