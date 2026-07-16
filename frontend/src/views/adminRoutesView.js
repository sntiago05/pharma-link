import { roleShell, statCard, statusBadge } from "./components.js";

function adminContent(pathname) {
  const page = pathname.includes("/admin/users")
    ? "users"
    : pathname.includes("/admin/roles")
      ? "roles"
      : pathname.includes("/admin/eps")
        ? "eps"
        : pathname.includes("/admin/pharmacies")
          ? "pharmacies"
          : pathname.includes("/admin/medicines")
            ? "medicines"
            : pathname.includes("/admin/profile")
              ? "profile"
              : "dashboard";

  const sections = {
    dashboard: `
      <div class="mt-5 grid gap-3 md:grid-cols-3">
        ${statCard("Usuarios", "42", "Activos en la plataforma")}
        ${statCard("EPS", "8", "Con órdenes registradas")}
        ${statCard("Farmacias", "12", "Operando actualmente")}
      </div>
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-semibold text-slate-900">Actividad reciente</p>
          <a href="/admin/users" class="text-sm font-medium text-emerald-700">Administrar</a>
        </div>
        <div class="mt-4 space-y-3">
          <article class="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
            <div>
              <p class="text-sm font-semibold text-slate-900">Nuevo usuario registrado</p>
              <p class="text-xs text-slate-500">Administrador · hace 10 min</p>
            </div>
            ${statusBadge("Activo", "emerald")}
          </article>
          <article class="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
            <div>
              <p class="text-sm font-semibold text-slate-900">Farmacia actualizada</p>
              <p class="text-xs text-slate-500">Inventario sincronizado</p>
            </div>
            ${statusBadge("Sincronizado", "slate")}
          </article>
        </div>
      </section>
    `,
    users: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Gestión de usuarios</p>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Ana Gómez</p>
            <p class="mt-2 text-sm text-slate-600">Paciente · Activo</p>
          </article>
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Luis Torres</p>
            <p class="mt-2 text-sm text-slate-600">EPS · Activo</p>
          </article>
        </div>
      </section>
    `,
    roles: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Gestión de roles</p>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Administrador</p>
            <p class="mt-2 text-sm text-slate-600">Acceso completo</p>
          </article>
        </div>
      </section>
    `,
    eps: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">EPS registradas</p>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">EPS Salud Total</p>
            <p class="mt-2 text-sm text-slate-600">8 órdenes activas</p>
          </article>
        </div>
      </section>
    `,
    pharmacies: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Farmacias registradas</p>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Farmacia Central</p>
            <p class="mt-2 text-sm text-slate-600">Inventario sincronizado</p>
          </article>
        </div>
      </section>
    `,
    medicines: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Medicamentos gestionados</p>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-900">Metformina</p>
            <p class="mt-2 text-sm text-slate-600">Disponible en 5 farmacias</p>
          </article>
        </div>
      </section>
    `,
    profile: `
      <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-semibold text-slate-900">Perfil administrador</p>
        <div class="mt-4 space-y-3">
          <article class="rounded-[20px] bg-slate-50 p-4">
            <p class="text-sm text-slate-500">Usuario</p>
            <p class="mt-1 text-base font-semibold text-slate-900">Administrador</p>
          </article>
        </div>
      </section>
    `
  };

  const sideContent = `
    <div class="rounded-[24px] bg-slate-50 p-4">
      <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Administrador</p>
      <h2 class="mt-2 text-lg font-semibold text-slate-900">Control de plataforma</h2>
      <p class="mt-2 text-sm text-slate-600">Gestiona usuarios, roles, EPS, farmacias y medicamentos.</p>
    </div>
    <div class="mt-4 rounded-[24px] border border-slate-200 p-4">
      <p class="text-sm font-semibold text-slate-900">Accesos rápidos</p>
      <div class="mt-3 space-y-2">
        <a href="/admin/users" class="block rounded-[20px] bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">Usuarios</a>
        <a href="/admin/roles" class="block rounded-[20px] bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">Roles</a>
        <a href="/admin/medicines" class="block rounded-[20px] bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">Medicamentos</a>
      </div>
    </div>
  `;

  const activePath = pathname.includes("/admin/users")
    ? "/admin/users"
    : pathname.includes("/admin/roles")
      ? "/admin/roles"
      : pathname.includes("/admin/eps")
        ? "/admin/eps"
        : pathname.includes("/admin/pharmacies")
          ? "/admin/pharmacies"
          : pathname.includes("/admin/medicines")
            ? "/admin/medicines"
            : pathname.includes("/admin/profile")
              ? "/admin/profile"
              : "/admin/dashboard";

  return roleShell({
    title: "Panel administrador",
    subtitle: "Supervisa el funcionamiento de PharmaLink.",
    navItems: [
      { label: "Dashboard", href: "/admin/dashboard", active: activePath === "/admin/dashboard" },
      { label: "Usuarios", href: "/admin/users", active: activePath === "/admin/users" },
      { label: "Roles", href: "/admin/roles", active: activePath === "/admin/roles" },
      { label: "EPS", href: "/admin/eps", active: activePath === "/admin/eps" },
      { label: "Farmacias", href: "/admin/pharmacies", active: activePath === "/admin/pharmacies" },
      { label: "Medicamentos", href: "/admin/medicines", active: activePath === "/admin/medicines" },
      { label: "Perfil", href: "/admin/profile", active: activePath === "/admin/profile" }
    ],
    content: sections[page],
    sideContent
  });
}

export function renderAdminSection({ currentPath }) {
  document.getElementById("app").innerHTML = adminContent(currentPath || "/admin/dashboard");
}

export function renderAdminDashboard({ currentPath }) {
  renderAdminSection({ currentPath });
}
