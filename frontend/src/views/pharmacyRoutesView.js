import { roleShell, statCard, statusBadge } from "./components.js";

function pharmacyContent(pathname) {
  const page = pathname.includes("/pharmacy/inventory")
    ? "inventory"
    : pathname.includes("/pharmacy/reservations")
      ? "reservations"
      : pathname.includes("/pharmacy/deliveries")
        ? "deliveries"
        : pathname.includes("/pharmacy/orders")
          ? "orders"
          : pathname.includes("/pharmacy/profile")
            ? "profile"
            : "dashboard";

  const sections = {
    dashboard: `
      <div class="mt-5 grid gap-3 md:grid-cols-3">
        ${statCard("Inventario activo", "142", "Medicamentos disponibles")}
        ${statCard("Reservas hoy", "8", "Por confirmar")}
        ${statCard("Entregas", "5", "Programadas")}
      </div>
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-semibold text-slate-900">Últimas acciones</p>
          <a href="/pharmacy/orders" class="text-sm font-medium text-emerald-700">Gestionar</a>
        </div>
        <div class="mt-4 space-y-3">
          <article class="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
            <div>
              <p class="text-sm font-semibold text-slate-900">Reserva confirmada</p>
              <p class="text-xs text-slate-500">Paciente: Daniela Rojas · 10:00</p>
            </div>
            ${statusBadge("Confirmada", "emerald")}
          </article>
          <article class="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
            <div>
              <p class="text-sm font-semibold text-slate-900">Entrega pendiente</p>
              <p class="text-xs text-slate-500">Medicamento: Metformina</p>
            </div>
            ${statusBadge("Pendiente", "amber")}
          </article>
        </div>
      </section>
    `,
    inventory: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Inventario de la farmacia</p>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Metformina 850 mg</p>
            <p class="mt-2 text-sm text-slate-600">12 unidades · Stock estable</p>
          </article>
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Amoxicilina</p>
            <p class="mt-2 text-sm text-slate-600">4 unidades · Reabastecer</p>
          </article>
        </div>
      </section>
    `,
    reservations: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Reservas por confirmar</p>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Reserva #110</p>
            <p class="mt-2 text-sm text-slate-600">Paciente Daniel · 11:00 · Metformina</p>
          </article>
        </div>
      </section>
    `,
    deliveries: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Entregas programadas</p>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Entrega #402</p>
            <p class="mt-2 text-sm text-slate-600">Paciente Laura · 15:30 · Confirmada</p>
          </article>
        </div>
      </section>
    `,
    orders: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Órdenes de la farmacia</p>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Orden #201</p>
            <p class="mt-2 text-sm text-slate-600">Estado: Actualizado</p>
          </article>
        </div>
      </section>
    `,
    profile: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Perfil farmacia</p>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm text-slate-500">Farmacia</p>
            <p class="mt-1 text-base font-semibold text-slate-900">Farmacia Central</p>
          </article>
        </div>
      </section>
    `
  };

  const sideContent = `
    <div class="rounded-[24px] bg-slate-50 p-4">
      <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Farmacia</p>
      <h2 class="mt-2 text-lg font-semibold text-slate-900">Operación diaria</h2>
      <p class="mt-2 text-sm text-slate-600">Controla inventario, reservas y entregas desde una sola vista.</p>
    </div>
    <div class="mt-4 rounded-[24px] border border-slate-200 p-4">
      <p class="text-sm font-semibold text-slate-900">Accesos rápidos</p>
      <div class="mt-3 space-y-2">
        <a href="/pharmacy/inventory" class="block rounded-[20px] bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">Inventario</a>
        <a href="/pharmacy/reservations" class="block rounded-[20px] bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">Reservas</a>
        <a href="/pharmacy/deliveries" class="block rounded-[20px] bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">Entregas</a>
      </div>
    </div>
  `;

  const activePath = pathname.includes("/pharmacy/inventory")
    ? "/pharmacy/inventory"
    : pathname.includes("/pharmacy/reservations")
      ? "/pharmacy/reservations"
      : pathname.includes("/pharmacy/deliveries")
        ? "/pharmacy/deliveries"
        : pathname.includes("/pharmacy/orders")
          ? "/pharmacy/orders"
          : pathname.includes("/pharmacy/profile")
            ? "/pharmacy/profile"
            : "/pharmacy/dashboard";

  return roleShell({
    title: "Panel farmacia",
    subtitle: "Gestiona inventario y coordinación de entregas.",
    navItems: [
      { label: "Dashboard", href: "/pharmacy/dashboard", active: activePath === "/pharmacy/dashboard" },
      { label: "Inventario", href: "/pharmacy/inventory", active: activePath === "/pharmacy/inventory" },
      { label: "Reservas", href: "/pharmacy/reservations", active: activePath === "/pharmacy/reservations" },
      { label: "Entregas", href: "/pharmacy/deliveries", active: activePath === "/pharmacy/deliveries" },
      { label: "Perfil", href: "/pharmacy/profile", active: activePath === "/pharmacy/profile" }
    ],
    content: sections[page],
    sideContent
  });
}

export function renderPharmacySection({ currentPath }) {
  document.getElementById("app").innerHTML = pharmacyContent(currentPath || "/pharmacy/dashboard");
}

export function renderPharmacyDashboard({ currentPath }) {
  renderPharmacySection({ currentPath });
}
