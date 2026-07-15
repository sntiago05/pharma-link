import { logout } from "../services/auth.js";

function profileTemplate(user) {
  return `
    <main class="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <section class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl items-center">
        <div class="w-full rounded-lg bg-white p-6 shadow-xl shadow-emerald-900/10 ring-1 ring-slate-200 sm:p-8">
          <p class="text-sm font-bold uppercase tracking-[0.24em] text-[#59B13F]">Pharma Link</p>
          <h1 class="mt-3 text-3xl font-extrabold text-[#0D4D44]">Perfil de usuario</h1>

          <dl class="mt-8 grid gap-4 sm:grid-cols-3">
            <div class="rounded-lg border border-slate-200 p-4">
              <dt class="text-xs font-bold uppercase tracking-wide text-slate-400">Nombre</dt>
              <dd class="mt-2 font-semibold text-slate-800">${user.name}</dd>
            </div>
            <div class="rounded-lg border border-slate-200 p-4">
              <dt class="text-xs font-bold uppercase tracking-wide text-slate-400">Email</dt>
              <dd class="mt-2 break-words font-semibold text-slate-800">${user.email}</dd>
            </div>
            <div class="rounded-lg border border-slate-200 p-4">
              <dt class="text-xs font-bold uppercase tracking-wide text-slate-400">Rol</dt>
              <dd class="mt-2 font-semibold text-slate-800">${user.role}</dd>
            </div>
          </dl>

          <button
            id="logoutButton"
            class="mt-8 w-full rounded-lg bg-[#0D4D44] px-4 py-3 text-base font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 sm:w-auto"
          >
            Cerrar sesion
          </button>
        </div>
      </section>
    </main>
  `;
}

export function renderProfile({ navigate, user }) {
  document.getElementById("app").innerHTML = profileTemplate(user);

  document.getElementById("logoutButton").addEventListener("click", () => {
    logout();
    navigate("/login");
  });
}
