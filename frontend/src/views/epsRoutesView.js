import { roleShell, statCard, statusBadge } from "./components.js";

function epsContent(pathname) {
  const page = pathname.includes("/eps/orders/create")
    ? "create"
    : pathname.includes("/eps/orders/history")
      ? "history"
      : pathname.includes("/eps/profile")
        ? "profile"
        : pathname.includes("/eps/orders")
          ? "orders"
          : "dashboard";

  const sections = {
    dashboard: `
      <div class="mt-5 grid gap-3 md:grid-cols-3">
        ${statCard("Órdenes emitidas", "18", "Esta semana")}
        ${statCard("Pendientes", "6", "En revisión")}
        ${statCard("Estado promedio", "94%", "Aprobado")}
      </div>
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-semibold text-slate-900">Últimas órdenes</p>
          <a href="/eps/orders" class="text-sm font-medium text-emerald-700">Ver todas</a>
        </div>
        <div class="mt-4 space-y-3">
          <article class="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
            <div>
              <p class="text-sm font-semibold text-slate-900">Orden EPS-104</p>
              <p class="text-xs text-slate-500">Paciente: Ana Gómez · Farmacia Norte</p>
            </div>
            ${statusBadge("En proceso", "amber")}
          </article>
          <article class="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
            <div>
              <p class="text-sm font-semibold text-slate-900">Orden EPS-103</p>
              <p class="text-xs text-slate-500">Paciente: Luis Torres · Farmacia Central</p>
            </div>
            ${statusBadge("Aprobada", "emerald")}
          </article>
        </div>
      </section>
    `,
    orders: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Órdenes emitidas</p>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">EPS-104</p>
            <p class="mt-2 text-sm text-slate-600">Paciente Ana Gómez · Estado: En proceso</p>
          </article>
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">EPS-105</p>
            <p class="mt-2 text-sm text-slate-600">Paciente Carlos Ruiz · Estado: Aprobada</p>
          </article>
        </div>
      </section>
    `,
    create: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Registrar nueva orden</p>
        <div class="mt-4 space-y-3">
          <div class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm text-slate-500">Paciente</p>
            <p class="mt-1 text-base font-semibold text-slate-900">María Fernández</p>
          </div>
          <div class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm text-slate-500">Medicamento</p>
            <p class="mt-1 text-base font-semibold text-slate-900">Metformina 850 mg</p>
          </div>
          <button class="rounded-[24px] bg-emerald-700 px-4 py-3 text-sm font-semibold text-white">Guardar orden</button>
        </div>
      </section>
    `,
    history: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Historial de órdenes</p>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">EPS-101</p>
            <p class="mt-2 text-sm text-slate-600">Aprobada · 08/07/2026</p>
          </article>
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">EPS-102</p>
            <p class="mt-2 text-sm text-slate-600">Entregada · 10/07/2026</p>
          </article>
        </div>
      </section>
    `,
    profile: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Perfil EPS</p>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm text-slate-500">Entidad</p>
            <p class="mt-1 text-base font-semibold text-slate-900">EPS Salud Total</p>
          </article>
        </div>
      </section>
    `
  };

  const sideContent = `
    <div class="rounded-[24px] bg-slate-50 p-4">
      <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">EPS</p>
      <h2 class="mt-2 text-lg font-semibold text-slate-900">Gestión de órdenes</h2>
      <p class="mt-2 text-sm text-slate-600">Registra, consulta y da seguimiento a las órdenes médicas.</p>
    </div>
    <div class="mt-4 rounded-[24px] border border-slate-200 p-4">
      <p class="text-sm font-semibold text-slate-900">Accesos rápidos</p>
      <div class="mt-3 space-y-2">
        <a href="/eps/orders/create" class="block rounded-[20px] bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">Crear orden</a>
        <a href="/eps/orders/history" class="block rounded-[20px] bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">Historial</a>
        <a href="/eps/profile" class="block rounded-[20px] bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">Perfil</a>
      </div>
    </div>
  `;

  const activePath = pathname.includes("/eps/orders/create")
    ? "/eps/orders/create"
    : pathname.includes("/eps/orders/history")
      ? "/eps/orders/history"
      : pathname.includes("/eps/profile")
        ? "/eps/profile"
        : pathname.includes("/eps/orders")
          ? "/eps/orders"
          : "/eps/dashboard";

  return roleShell({
    title: "Panel EPS",
    subtitle: "Centraliza la emisión y el seguimiento de órdenes.",
    navItems: [
      { label: "Dashboard", href: "/eps/dashboard", active: activePath === "/eps/dashboard" },
      { label: "Órdenes", href: "/eps/orders", active: activePath === "/eps/orders" },
      { label: "Crear", href: "/eps/orders/create", active: activePath === "/eps/orders/create" },
      { label: "Historial", href: "/eps/orders/history", active: activePath === "/eps/orders/history" },
      { label: "Perfil", href: "/eps/profile", active: activePath === "/eps/profile" }
    ],
    content: sections[page],
    sideContent
  });
}

export function renderEpsSection({ currentPath }) {
  document.getElementById("app").innerHTML = epsContent(currentPath || "/eps/dashboard");
}

export function renderEpsDashboard({ currentPath }) {
  renderEpsSection({ currentPath });
}
