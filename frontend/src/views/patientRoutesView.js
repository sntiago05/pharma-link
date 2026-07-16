import { roleShell, statCard, statusBadge } from "./components.js";

function patientContent(pathname, user) {
  const patientName = user?.name || "Paciente";
  const page = pathname.includes("/patient/orders")
    ? "orders"
    : pathname.includes("/patient/availability")
      ? "availability"
      : pathname.includes("/patient/reservations")
        ? "reservations"
        : pathname.includes("/patient/profile")
          ? "profile"
          : "dashboard";

  const sections = {
    dashboard: `
      <div class="mt-5 grid gap-3 md:grid-cols-3">
        ${statCard("Órdenes activas", "3", "Pendientes de retiro")}
        ${statCard("Reservas", "2", "Programadas hoy")}
        ${statCard("Farmacias disponibles", "5", "Cerca de tu ubicación")}
      </div>
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-semibold text-slate-900">Actividad reciente</p>
          <a href="/patient/orders" class="text-sm font-medium text-emerald-700">Ver todo</a>
        </div>
        <div class="mt-4 space-y-3">
          <article class="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
            <div>
              <p class="text-sm font-semibold text-slate-900">Orden médica aprobada</p>
              <p class="text-xs text-slate-500">Farmacia Central · 14:30</p>
            </div>
            ${statusBadge("Listo", "emerald")}
          </article>
          <article class="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
            <div>
              <p class="text-sm font-semibold text-slate-900">Reserva confirmada</p>
              <p class="text-xs text-slate-500">Farmacia Norte · 09:00</p>
            </div>
            ${statusBadge("Confirmada", "slate")}
          </article>
        </div>
      </section>
    `,
    orders: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-semibold text-slate-900">Órdenes médicas</p>
          <a href="/patient/availability" class="text-sm font-medium text-emerald-700">Ver disponibilidad</a>
        </div>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-semibold text-slate-900">Orden #3821</p>
              ${statusBadge("Listo para retirar", "emerald")}
            </div>
            <p class="mt-2 text-sm text-slate-600">Metformina 850 mg · Farmacia Central</p>
          </article>
          <article class="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-semibold text-slate-900">Orden #3822</p>
              ${statusBadge("Pendiente", "amber")}
            </div>
            <p class="mt-2 text-sm text-slate-600">Amoxicilina · Farmacia Norte</p>
          </article>
        </div>
      </section>
    `,
    availability: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Disponibilidad de medicamentos</p>
        <div class="mt-4 space-y-3">
          <article class="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
            <div>
              <p class="text-sm font-semibold text-slate-900">Paracetamol 500 mg</p>
              <p class="text-xs text-slate-500">Disponible en 3 farmacias</p>
            </div>
            ${statusBadge("Disponible", "emerald")}
          </article>
          <article class="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
            <div>
              <p class="text-sm font-semibold text-slate-900">Ibuprofeno 400 mg</p>
              <p class="text-xs text-slate-500">Stock bajo</p>
            </div>
            ${statusBadge("Bajo", "amber")}
          </article>
        </div>
      </section>
    `,
    reservations: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-semibold text-slate-900">Reservas activas</p>
          <a href="/patient/profile" class="text-sm font-medium text-emerald-700">Ver perfil</a>
        </div>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-semibold text-slate-900">Reserva para mañana</p>
              ${statusBadge("Confirmada", "slate")}
            </div>
            <p class="mt-2 text-sm text-slate-600">Farmacia Norte · 09:00 · Amoxicilina</p>
          </article>
          <article class="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-semibold text-slate-900">Cancelar reserva</p>
              ${statusBadge("Opcional", "amber")}
            </div>
            <p class="mt-2 text-sm text-slate-600">Puedes cancelar desde el detalle antes de las 8:00.</p>
          </article>
        </div>
      </section>
    `,
    profile: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Perfil del paciente</p>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm text-slate-500">Nombre</p>
            <p class="mt-1 text-base font-semibold text-slate-900">${patientName}</p>
          </article>
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm text-slate-500">Correo</p>
            <p class="mt-1 text-base font-semibold text-slate-900">paciente@pharmalink.com</p>
          </article>
        </div>
      </section>
    `
  };

  const sideContent = `
    <div class="rounded-[24px] bg-slate-50 p-4">
      <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Bienvenido</p>
      <h2 class="mt-2 text-lg font-semibold text-slate-900">${patientName}</h2>
      <p class="mt-2 text-sm text-slate-600">Gestiona tus órdenes, disponibilidad y reservas desde un solo lugar.</p>
    </div>
    <div class="mt-4 rounded-[24px] border border-slate-200 p-4">
      <p class="text-sm font-semibold text-slate-900">Accesos rápidos</p>
      <div class="mt-3 space-y-2">
        <a href="/patient/orders" class="block rounded-[20px] bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">Consultar órdenes</a>
        <a href="/patient/availability" class="block rounded-[20px] bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">Ver disponibilidad</a>
        <a href="/patient/reservations" class="block rounded-[20px] bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">Mis reservas</a>
      </div>
    </div>
  `;

  const activePath = pathname.includes("/patient/orders")
    ? "/patient/orders"
    : pathname.includes("/patient/availability")
      ? "/patient/availability"
      : pathname.includes("/patient/reservations")
        ? "/patient/reservations"
        : pathname.includes("/patient/profile")
          ? "/patient/profile"
          : "/patient/dashboard";

  return roleShell({
    title: "Panel del paciente",
    subtitle: "Consulta y administra tus medicamentos de forma rápida.",
    navItems: [
      { label: "Dashboard", href: "/patient/dashboard", active: activePath === "/patient/dashboard" },
      { label: "Órdenes", href: "/patient/orders", active: activePath === "/patient/orders" },
      { label: "Disponibilidad", href: "/patient/availability", active: activePath === "/patient/availability" },
      { label: "Reservas", href: "/patient/reservations", active: activePath === "/patient/reservations" },
      { label: "Perfil", href: "/patient/profile", active: activePath === "/patient/profile" }
    ],
    content: sections[page],
    sideContent
  });
}

export function renderPatientSection({ navigate, user, currentPath }) {
  document.getElementById("app").innerHTML = patientContent(currentPath || "/patient/dashboard", user);
}

export function renderPatientDashboard({ navigate, user, currentPath }) {
  renderPatientSection({ navigate, user, currentPath });
}
