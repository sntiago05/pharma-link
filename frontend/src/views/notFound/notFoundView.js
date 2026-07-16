import { roleShell } from "../components.js";

function notFoundTemplate() {
  const content = `
    <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Error</p>
      <h2 class="mt-3 text-2xl font-semibold text-[#0D4D44]">404 · No encontramos esta ruta</h2>
      <p class="mt-3 text-sm text-slate-600">La página que buscas no existe o todavía no está disponible en PharmaLink.</p>
      <div class="mt-5 flex flex-wrap gap-3">
        <a href="/" class="rounded-[24px] bg-emerald-700 px-4 py-3 text-sm font-semibold text-white">Volver al inicio</a>
        <a href="/patient/dashboard" class="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">Ir al panel</a>
      </div>
    </section>
  `;

  const sideContent = `
    <div class="rounded-[24px] bg-slate-50 p-4">
      <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Pharma Link</p>
      <h3 class="mt-2 text-lg font-semibold text-slate-900">Ruta no disponible</h3>
      <p class="mt-2 text-sm text-slate-600">Verifica la URL o vuelve a la navegación principal.</p>
    </div>
  `;

  return roleShell({
    title: "Página no encontrada",
    subtitle: "La ruta solicitada no está disponible en este momento.",
    navItems: [],
    content,
    sideContent
  });
}

export function renderNotFound() {
  document.getElementById("app").innerHTML = notFoundTemplate();
}
