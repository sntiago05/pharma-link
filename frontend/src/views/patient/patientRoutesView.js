import * as patientApi from "../../services/patient.js";
import { listNotifications, markAllAsRead } from "../../services/notifications.js";
import { loadContext } from "../../services/auth.js";
import { getContext } from "../../services/session.js";
import {
  emptyState,
  errorState,
  escapeHtml,
  formatDate,
  formatTime,
  loadingState,
  panel,
  primaryButton,
  promoCard,
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
 * Patient panel.
 *
 * Covers the flow the project is built around: see your orders, find a pharmacy
 * that has the medicines, pick a slot, reserve, and manage the reservation.
 *
 * Orders are not created here: an EPS issues them (from its own panel or the
 * integration webhook) and this panel consumes them.
 */

const SECTIONS = ["dashboard", "orders", "availability", "reservations", "notifications", "profile"];

/** Backend limits, mirrored to disable actions that would return 409. */
const MAX_CANCELLATIONS = 3;
const MAX_RESCHEDULES = 2;

const NAV = (active) => [
  { label: "Dashboard", href: "/patient/dashboard", active: active === "dashboard" },
  { label: "Órdenes", href: "/patient/orders", active: active === "orders" },
  { label: "Reservar", href: "/patient/availability", active: active === "availability" },
  { label: "Reservas", href: "/patient/reservations", active: active === "reservations" },
  { label: "Notificaciones", href: "/patient/notifications", active: active === "notifications" },
  { label: "Perfil", href: "/patient/profile", active: active === "profile" }
];

/** Local `YYYY-MM-DD`; `toISOString()` alone would shift the day in UTC-5. */
const todayIso = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

function paint({ user, section, body }) {
  document.getElementById("app").innerHTML = roleShell({
    title: "Panel del paciente",
    subtitle: "Consulta tus órdenes, reserva en una farmacia y sigue tus entregas.",
    navItems: NAV(section),
    content: `<div id="patientContent">${body}</div>`,
    sideContent: `
      ${userCard({ user })}
      ${quickLinks([
        { label: "Ver mis órdenes", href: "/patient/orders" },
        { label: "Reservar medicamento", href: "/patient/availability" },
        { label: "Mis reservas", href: "/patient/reservations" }
      ])}
    `
  });
}

const setContent = (html) => {
  const node = document.getElementById("patientContent");
  if (node) node.innerHTML = html;
};

/**
 * Without a patient profile there is no EPS, and without an EPS the API cannot
 * resolve which pharmacies are available. Every section funnels through here.
 */
const profileRequired = () => `
  <div class="mt-5 rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-center">
    <p class="text-base font-semibold text-amber-900">Completa tu perfil para continuar</p>
    <p class="mx-auto mt-2 max-w-md text-sm text-amber-800">
      Necesitamos tu EPS y tu documento para mostrarte las farmacias donde puedes reclamar tus medicamentos.
    </p>
    <a href="/patient/profile" class="mt-4 inline-block rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white">
      Completar perfil
    </a>
  </div>
`;

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

async function renderDashboard() {
  setContent(loadingState("Cargando tu información..."));

  const [orders, reservations, notifications] = await Promise.all([
    patientApi.listMyOrders(),
    patientApi.listMyReservations({ status: "RESERVED" }),
    listNotifications({ limit: 5 })
  ]);

  const pending = orders.filter((order) => order.status === "PENDING" && !order.is_expired);
  const delivered = orders.filter((order) => order.status === "DELIVERED");

  const activity = notifications.length
    ? notifications
        .map(
          (notification) => `
          <article class="mb-2 flex items-start justify-between gap-3 rounded-[20px] bg-slate-50 px-4 py-3">
            <div>
              <p class="text-sm font-semibold text-slate-900">${escapeHtml(notification.title)}</p>
              <p class="mt-1 text-xs text-slate-500">${escapeHtml(notification.message)}</p>
            </div>
            ${notification.read_at ? "" : statusBadge("Nuevo", "emerald")}
          </article>`
        )
        .join("")
    : emptyState("Sin actividad todavía.", "Aquí verás tus reservas y entregas.");

  setContent(`
    <div class="mt-5 grid gap-3 md:grid-cols-3">
      ${statCard("Órdenes por reservar", String(pending.length), pending.length ? "Listas para agendar" : "Sin órdenes pendientes")}
      ${statCard("Reservas activas", String(reservations.length), reservations.length ? "Agendadas" : "Ninguna agendada")}
      ${statCard("Entregadas", String(delivered.length), "Histórico")}
    </div>

    ${
      pending.length
        ? panel({
            title: "Órdenes listas para reservar",
            action: `<a href="/patient/availability" class="text-sm font-medium text-emerald-700">Reservar ahora</a>`,
            body: pending
              .slice(0, 3)
              .map(
                (order) => `
                <article class="mb-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <p class="text-sm font-semibold text-slate-900">Orden ${escapeHtml(order.order_number)}</p>
                    ${statusBadge("Pendiente", "amber")}
                  </div>
                  <p class="mt-2 text-sm text-slate-600">${escapeHtml(order.items.map((item) => item.name).join(", "))}</p>
                  <p class="mt-1 text-xs text-slate-400">Vence el ${formatDate(order.expiration_date)}</p>
                </article>`
              )
              .join("")
          })
        : ""
    }

    ${panel({
      title: "Actividad reciente",
      action: `<a href="/patient/notifications" class="text-sm font-medium text-emerald-700">Ver todo</a>`,
      body: activity
    })}

    ${promoCard({
      title: "Tu salud es nuestra prioridad",
      subtitle: "Reserva tus medicamentos y sigue tu atención desde el panel del paciente.",
      buttonLabel: "Agenda ahora",
      buttonHref: "/patient/availability",
      image: "/img/promo.png",
      imageAlt: "Ilustración de salud"
    })}
  `);
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                      */
/* -------------------------------------------------------------------------- */

function orderCard(order) {
  const reservation = order.active_reservation;
  // An order can sit at PENDING and still be past its expiry until the hourly
  // sweep runs, so `is_expired` decides what the patient is shown.
  const status = order.is_expired && order.status !== "DELIVERED" ? "EXPIRED" : order.status;

  return `
    <article class="mb-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p class="text-sm font-semibold text-slate-900">Orden ${escapeHtml(order.order_number)}</p>
          <p class="text-xs text-slate-400">${escapeHtml(order.eps_name || "")} · vence ${formatDate(order.expiration_date)}</p>
        </div>
        ${statusBadge(statusLabel(status), statusTone(status))}
      </div>

      <ul class="mt-3 space-y-1">
        ${order.items
          .map(
            (item) =>
              `<li class="text-sm text-slate-600">• ${escapeHtml(item.name)} ${item.presentation ? `<span class="text-slate-400">(${escapeHtml(item.presentation)})</span>` : ""} — ${item.quantity} und.</li>`
          )
          .join("")}
      </ul>

      ${
        reservation
          ? `<p class="mt-3 rounded-[16px] bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
               Reservada en ${escapeHtml(reservation.pharmacyName)} el ${formatDate(reservation.reservationDate)} a las ${formatTime(reservation.startTime)}
             </p>`
          : ""
      }

      ${
        status === "PENDING"
          ? `<div class="mt-3">${primaryButton("Reservar en una farmacia", { attrs: `data-reserve="${order.id}"` })}</div>`
          : ""
      }
    </article>
  `;
}

async function renderOrders({ navigate }) {
  setContent(loadingState("Cargando tus órdenes..."));

  const orders = await patientApi.listMyOrders();

  setContent(
    panel({
      title: "Mis órdenes médicas",
      action: `<a href="/patient/availability" class="text-sm font-medium text-emerald-700">Reservar</a>`,
      body: orders.length
        ? orders.map(orderCard).join("")
        : emptyState(
            "Todavía no tienes órdenes médicas.",
            "Tu EPS las genera; aparecerán aquí automáticamente."
          )
    })
  );

  document.querySelectorAll("[data-reserve]").forEach((button) => {
    button.addEventListener("click", () =>
      navigate(`/patient/availability?order=${button.dataset.reserve}`)
    );
  });
}

/* -------------------------------------------------------------------------- */
/* Availability / booking wizard                                               */
/* -------------------------------------------------------------------------- */

/**
 * Booking wizard: order -> pharmacy -> date -> slot.
 *
 * Slots are re-fetched on every change instead of cached: capacity is shared
 * with other patients, and a stale grid would only fail at the final step.
 */
async function renderAvailability({ navigate }) {
  setContent(loadingState("Buscando tus órdenes..."));

  const orders = await patientApi.listMyOrders();
  const reservable = orders.filter((order) => order.status === "PENDING" && !order.is_expired);

  if (!reservable.length) {
    setContent(
      panel({
        title: "Reservar medicamento",
        body: emptyState(
          "No tienes órdenes disponibles para reservar.",
          "Solo las órdenes pendientes y vigentes pueden reservarse."
        )
      })
    );
    return;
  }

  const preselected = new URLSearchParams(window.location.search).get("order");
  const initialOrder = reservable.find((order) => String(order.id) === preselected) || reservable[0];

  setContent(
    panel({
      title: "Reservar medicamento",
      body: `
        <div class="space-y-4">
          ${selectField({
            id: "orderSelect",
            label: "1. Escoge la orden",
            value: initialOrder.id,
            placeholder: "Selecciona una orden",
            options: reservable.map((order) => ({
              value: order.id,
              label: `${order.order_number} — ${order.items.map((item) => item.name).join(", ")}`
            }))
          })}
          <div id="pharmacyStep"></div>
          <div id="dateStep" class="hidden">
            ${textField({ id: "dateInput", label: "3. Escoge la fecha", type: "date", value: todayIso(), min: todayIso() })}
          </div>
          <div id="slotStep"></div>
        </div>
      `
    })
  );

  const state = { orderId: initialOrder.id, pharmacyId: null, date: todayIso(), slot: null };
  const pharmacyStep = document.getElementById("pharmacyStep");
  const dateStep = document.getElementById("dateStep");
  const slotStep = document.getElementById("slotStep");

  async function loadSlots() {
    if (!state.pharmacyId) return;

    slotStep.innerHTML = loadingState("Consultando horarios...");
    state.slot = null;

    let slots;
    try {
      slots = await patientApi.listSlots(state.pharmacyId, state.date);
    } catch (error) {
      slotStep.innerHTML = errorState(error.detail || error.message, { retry: false });
      return;
    }

    if (!slots.length) {
      slotStep.innerHTML = emptyState("No hay horarios disponibles para esa fecha.", "Prueba con otro día.");
      return;
    }

    slotStep.innerHTML = `
      <p class="mb-2 text-sm font-semibold text-slate-700">4. Escoge la hora</p>
      <div class="flex flex-wrap gap-2">
        ${slots
          .map(
            (slot) => `
            <button type="button" data-slot="${slot.startTime}" data-end="${slot.endTime}"
              class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-400">
              ${slot.startTime}<span class="ml-1 text-xs text-slate-400">(${slot.availableCapacity})</span>
            </button>`
          )
          .join("")}
      </div>
      <div class="mt-4">${primaryButton("Confirmar reserva", { id: "confirmReserve", attrs: "disabled" })}</div>
      <p id="reserveError" class="mt-2 min-h-5 text-sm font-medium text-red-600"></p>
    `;

    const confirmButton = document.getElementById("confirmReserve");

    slotStep.querySelectorAll("[data-slot]").forEach((button) => {
      button.addEventListener("click", () => {
        state.slot = { start: button.dataset.slot, end: button.dataset.end };
        slotStep
          .querySelectorAll("[data-slot]")
          .forEach((other) => other.classList.remove("border-emerald-500", "bg-emerald-50", "text-emerald-700"));
        button.classList.add("border-emerald-500", "bg-emerald-50", "text-emerald-700");
        confirmButton.disabled = false;
      });
    });

    confirmButton.addEventListener("click", async () => {
      if (!state.slot) return;

      const errorNode = document.getElementById("reserveError");
      errorNode.textContent = "";
      confirmButton.disabled = true;
      confirmButton.textContent = "Reservando...";

      try {
        await patientApi.createReservation({
          orderId: Number(state.orderId),
          pharmacyId: state.pharmacyId,
          reservationDate: state.date,
          startTime: state.slot.start,
          endTime: state.slot.end
        });

        toast("Reserva creada correctamente.");
        navigate("/patient/reservations");
      } catch (error) {
        // Surfaces the backend's own rule message, e.g. "Insufficient stock of
        // Losartan 50 mg (MED-002): 1 available, 3 required."
        errorNode.textContent = error.detail || error.message;
        confirmButton.disabled = false;
        confirmButton.textContent = "Confirmar reserva";
        // Someone may have taken the last place; refresh the grid.
        loadSlots();
      }
    });
  }

  async function loadPharmacies() {
    pharmacyStep.innerHTML = loadingState("Buscando farmacias con disponibilidad...");
    slotStep.innerHTML = "";
    dateStep.classList.add("hidden");
    state.pharmacyId = null;

    let pharmacies;
    try {
      pharmacies = await patientApi.listPharmaciesForOrder(state.orderId);
    } catch (error) {
      pharmacyStep.innerHTML = errorState(error.detail || error.message, { retry: false });
      return;
    }

    if (!pharmacies.length) {
      pharmacyStep.innerHTML = emptyState(
        "No hay farmacias asociadas a tu EPS.",
        "Comunícate con tu EPS para más información."
      );
      return;
    }

    pharmacyStep.innerHTML = `
      <p class="mb-2 text-sm font-semibold text-slate-700">2. Escoge la farmacia</p>
      <div class="space-y-2">
        ${pharmacies
          .map((pharmacy) => {
            // Only offer what the API would actually accept: the whole order in
            // stock and a configured slot grid.
            const bookable = pharmacy.isComplete && pharmacy.hasWorkingHours;
            const reason = !pharmacy.isComplete ? "Stock insuficiente" : "Sin horarios";

            return `
              <button type="button" data-pharmacy="${pharmacy.id}" ${bookable ? "" : "disabled"}
                class="w-full rounded-[20px] border p-4 text-left transition ${bookable ? "border-slate-200 bg-white hover:border-emerald-400" : "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"}">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="text-sm font-semibold text-slate-900">${escapeHtml(pharmacy.name)}</p>
                  ${bookable ? statusBadge("Disponible", "emerald") : statusBadge(reason, "amber")}
                </div>
                <p class="mt-1 text-xs text-slate-500">${escapeHtml([pharmacy.address, pharmacy.city].filter(Boolean).join(", "))}</p>
                <p class="mt-2 text-xs text-slate-500">
                  ${pharmacy.items.map((item) => `${escapeHtml(item.name)}: ${item.available}/${item.required}`).join(" · ")}
                </p>
              </button>`;
          })
          .join("")}
      </div>
    `;

    pharmacyStep.querySelectorAll("[data-pharmacy]").forEach((button) => {
      button.addEventListener("click", () => {
        state.pharmacyId = Number(button.dataset.pharmacy);
        pharmacyStep
          .querySelectorAll("[data-pharmacy]")
          .forEach((other) => other.classList.remove("border-emerald-500", "ring-2", "ring-emerald-100"));
        button.classList.add("border-emerald-500", "ring-2", "ring-emerald-100");
        dateStep.classList.remove("hidden");
        loadSlots();
      });
    });
  }

  document.getElementById("orderSelect").addEventListener("change", (event) => {
    state.orderId = event.target.value;
    if (state.orderId) loadPharmacies();
  });

  document.getElementById("dateInput").addEventListener("change", (event) => {
    state.date = event.target.value;
    loadSlots();
  });

  await loadPharmacies();
}

/* -------------------------------------------------------------------------- */
/* Reservations                                                                */
/* -------------------------------------------------------------------------- */

async function renderReservations(ctx) {
  setContent(loadingState("Cargando tus reservas..."));

  const reservations = await patientApi.listMyReservations();

  if (!reservations.length) {
    setContent(
      panel({
        title: "Mis reservas",
        body: emptyState("No tienes reservas.", "Reserva desde una de tus órdenes pendientes.")
      })
    );
    return;
  }

  setContent(
    panel({
      title: "Mis reservas",
      body: reservations
        .map((reservation) => {
          const active = reservation.status === "RESERVED";
          const canCancel = active && reservation.cancellation_count < MAX_CANCELLATIONS;
          const canReschedule = active && reservation.reschedule_count < MAX_RESCHEDULES;

          return `
            <article class="mb-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-semibold text-slate-900">${escapeHtml(reservation.pharmacy_name)}</p>
                  <p class="text-xs text-slate-400">Orden ${escapeHtml(reservation.order_number)}</p>
                </div>
                ${statusBadge(statusLabel(reservation.status), statusTone(reservation.status))}
              </div>

              <p class="mt-2 text-sm text-slate-600">
                ${formatDate(reservation.reservation_date)} · ${formatTime(reservation.start_time)} - ${formatTime(reservation.end_time)}
              </p>
              <p class="mt-1 text-xs text-slate-500">
                ${escapeHtml(reservation.items.map((item) => `${item.name} (${item.quantity})`).join(", "))}
              </p>

              ${
                active
                  ? `<div class="mt-3 flex flex-wrap gap-2">
                       ${secondaryButton("Reprogramar", {
                         tone: "emerald",
                         attrs: `data-reschedule="${reservation.id}" ${canReschedule ? "" : "disabled"}`
                       })}
                       ${secondaryButton("Cancelar", {
                         tone: "red",
                         attrs: `data-cancel="${reservation.id}" ${canCancel ? "" : "disabled"}`
                       })}
                     </div>
                     ${
                       !canReschedule || !canCancel
                         ? `<p class="mt-2 text-xs text-amber-700">
                              ${!canReschedule ? `Alcanzaste el límite de ${MAX_RESCHEDULES} reprogramaciones. ` : ""}
                              ${!canCancel ? `Alcanzaste el límite de ${MAX_CANCELLATIONS} cancelaciones.` : ""}
                            </p>`
                         : ""
                     }`
                  : ""
              }
              <div data-reschedule-form="${reservation.id}" class="hidden"></div>
            </article>`;
        })
        .join("")
    })
  );

  document.querySelectorAll("[data-cancel]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("¿Seguro que deseas cancelar esta reserva? El stock volverá a quedar disponible.")) return;

      button.disabled = true;
      try {
        await patientApi.cancelReservation(button.dataset.cancel);
        toast("Reserva cancelada.");
        await renderReservations(ctx);
      } catch (error) {
        toast(error.detail || error.message, "red");
        button.disabled = false;
      }
    });
  });

  document.querySelectorAll("[data-reschedule]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.reschedule;
      const reservation = reservations.find((item) => String(item.id) === id);
      const container = document.querySelector(`[data-reschedule-form="${id}"]`);

      if (!container.classList.contains("hidden")) {
        container.classList.add("hidden");
        return;
      }

      container.classList.remove("hidden");
      container.innerHTML = `
        <div class="mt-3 rounded-[16px] border border-emerald-200 bg-white p-3">
          ${textField({ id: `date-${id}`, label: "Nueva fecha", type: "date", value: todayIso(), min: todayIso() })}
          <div id="slots-${id}" class="mt-3"></div>
        </div>
      `;

      const loadSlots = async () => {
        const slotsNode = document.getElementById(`slots-${id}`);
        const date = document.getElementById(`date-${id}`).value;
        slotsNode.innerHTML = loadingState("Consultando horarios...");

        try {
          const slots = await patientApi.listSlots(reservation.pharmacy_id, date);
          if (!slots.length) {
            slotsNode.innerHTML = emptyState("Sin horarios ese día.");
            return;
          }

          slotsNode.innerHTML = `
            <div class="flex flex-wrap gap-2">
              ${slots
                .map(
                  (slot) =>
                    `<button type="button" data-new-slot="${slot.startTime}" data-new-end="${slot.endTime}"
                      class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-emerald-400">${slot.startTime}</button>`
                )
                .join("")}
            </div>
          `;

          slotsNode.querySelectorAll("[data-new-slot]").forEach((slotButton) => {
            slotButton.addEventListener("click", async () => {
              try {
                await patientApi.rescheduleReservation(id, {
                  reservationDate: date,
                  startTime: slotButton.dataset.newSlot,
                  endTime: slotButton.dataset.newEnd
                });
                toast("Reserva reprogramada.");
                await renderReservations(ctx);
              } catch (error) {
                toast(error.detail || error.message, "red");
              }
            });
          });
        } catch (error) {
          slotsNode.innerHTML = errorState(error.detail || error.message, { retry: false });
        }
      };

      document.getElementById(`date-${id}`).addEventListener("change", loadSlots);
      await loadSlots();
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
/* Profile                                                                     */
/* -------------------------------------------------------------------------- */

async function renderProfileSection({ user, navigate }) {
  setContent(loadingState("Cargando perfil..."));

  const [profile, epsList] = await Promise.all([patientApi.getProfile(), patientApi.listEps()]);

  if (profile) {
    const eps = epsList.find((item) => item.id === profile.eps_id);
    setContent(
      panel({
        title: "Perfil del paciente",
        body: `
          <div class="space-y-3">
            ${[
              ["Nombre", user.fullName],
              ["Correo", user.email],
              ["Documento", profile.document],
              ["EPS", eps?.name || String(profile.eps_id)],
              ["Teléfono", profile.phone || "No registrado"]
            ]
              .map(
                ([label, value]) => `
                <div class="rounded-[20px] bg-slate-50 p-4">
                  <p class="text-sm text-slate-500">${label}</p>
                  <p class="mt-1 text-base font-semibold text-slate-900">${escapeHtml(value)}</p>
                </div>`
              )
              .join("")}
          </div>
        `
      })
    );
    return;
  }

  setContent(
    panel({
      title: "Completa tu perfil",
      body: `
        <p class="mb-4 text-sm text-slate-500">
          Registra tu EPS y documento para poder reservar tus medicamentos.
        </p>
        <form id="profileForm" class="space-y-4" novalidate>
          ${selectField({
            id: "epsId",
            label: "EPS",
            options: epsList.map((eps) => ({ value: eps.id, label: eps.name })),
            placeholder: "Selecciona tu EPS"
          })}
          ${textField({ id: "documentInput", label: "Documento", placeholder: "1020304050" })}
          ${textField({ id: "phoneInput", label: "Teléfono (opcional)", type: "tel", required: false })}
          <p id="profileError" class="min-h-5 text-sm font-medium text-red-600"></p>
          ${primaryButton("Guardar perfil", { type: "submit", full: true })}
        </form>
      `
    })
  );

  document.getElementById("profileForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const errorNode = document.getElementById("profileError");
    const epsId = document.getElementById("epsId").value;
    const documentValue = document.getElementById("documentInput").value.trim();

    if (!epsId || !documentValue) {
      errorNode.textContent = "Selecciona tu EPS e ingresa tu documento.";
      return;
    }

    try {
      await patientApi.createProfile({
        epsId: Number(epsId),
        document: documentValue,
        phone: document.getElementById("phoneInput").value.trim()
      });

      // Refresh the cached context so the panel sees the new EPS immediately.
      await loadContext();
      toast("Perfil creado correctamente.");
      navigate("/patient/dashboard");
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
  orders: renderOrders,
  availability: renderAvailability,
  reservations: renderReservations,
  notifications: renderNotificationsSection,
  profile: renderProfileSection
};

export async function renderPatientDashboard({ navigate, user, currentPath }) {
  const section = sectionFromPath(currentPath, SECTIONS, "dashboard");

  paint({ user, section, body: loadingState() });
  bindLogout(navigate);

  // The cached context may be absent after a reload, or stale right after the
  // profile is created, so it is refreshed rather than trusted blindly.
  let context = getContext();
  if (!context || context.role !== user.role) {
    try {
      context = await loadContext();
    } catch (error) {
      setContent(errorState(error.detail || error.message));
      return;
    }
  }

  // Every section except the profile form needs an EPS to query against.
  if (!context.patient && section !== "profile") {
    setContent(profileRequired());
    return;
  }

  try {
    await RENDERERS[section]({ navigate, user, currentPath, context });
  } catch (error) {
    if (error?.status === 401) throw error;
    setContent(errorState(error.detail || error.message));
    document
      .querySelector("[data-retry]")
      ?.addEventListener("click", () => renderPatientDashboard({ navigate, user, currentPath }));
  }
}

/** Kept so older imports of this name keep resolving. */
export const renderPatientSection = renderPatientDashboard;
