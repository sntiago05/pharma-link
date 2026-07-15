function patientTemplate(user) {
  return `
  <main class="min-h-screen bg-slate-100 px-4 py-4">
    <div class="mx-auto w-full max-w-[390px] overflow-hidden rounded-[32px] bg-white shadow-xl ring-1 ring-slate-200 sm:max-w-[420px]">
      <header class="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-5">
        <div>
          <p class="text-xs uppercase tracking-[0.4em] text-teal-900">Pharma</p>
          <p class="text-3xl font-semibold text-slate-900">Link</p>
        </div>

        <button id="menuToggle" class="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-700 shadow-sm sm:hidden">
          <span class="sr-only">Abrir menú</span>
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <nav id="desktopMenu" class="hidden items-center gap-4 sm:flex">
          <a href="/profile" class="text-sm font-medium text-slate-700 transition hover:text-emerald-700">Perfil</a>
          <a href="/login" class="text-sm font-medium text-slate-700 transition hover:text-emerald-700">Salir</a>
        </nav>
      </header>

      <div id="mobileMenu" class="hidden border-b border-slate-200 bg-slate-50 px-5 py-4 sm:hidden">
        <a href="/profile" class="block rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-emerald-50">Perfil</a>
        <a href="/login" class="mt-3 block rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-emerald-50">Salir</a>
      </div>

      <section class="relative overflow-hidden rounded-[32px] bg-emerald-700 px-5 pb-7 pt-7 text-white shadow-xl shadow-slate-400/20 sm:px-6">
        <div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div class="sm:max-w-[55%]">
            <p class="text-xs uppercase tracking-[0.4em] text-emerald-200">F A R M A C I A</p>
            <h1 class="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">Your health is<br/>our priority</h1>
            <p class="mt-3 text-sm text-emerald-100">Pharmaceuticals, care & wellness for you.</p>
          </div>
          <img class="h-32 w-32 rounded-[28px] object-cover shadow-2xl shadow-slate-950/10 sm:h-36 sm:w-36" src="/img/image 9.png" alt="Salud" />
        </div>

        <button class="mt-5 inline-flex items-center justify-center rounded-[24px] bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100">
          Schedule now
        </button>
      </section>

      <section class="mt-5 rounded-[32px] bg-white px-5 py-5 shadow-xl ring-1 ring-slate-200 sm:px-6">
        <div class="flex items-center gap-3 rounded-[24px] bg-slate-100 px-4 py-4 shadow-sm">
          <div class="flex h-12 w-12 items-center justify-center rounded-3xl bg-white shadow-sm">
            <img class="h-6 w-6" src="/img/images categorias.png" alt="Categorías" />
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Buscar</p>
            <p class="text-sm font-semibold text-slate-900">Busca medicamentos y más</p>
          </div>
        </div>
      </section>

      <section class="mt-5 grid gap-3 sm:grid-cols-2">
        <div class="rounded-[32px] bg-white px-4 py-5 text-center shadow-xl ring-1 ring-slate-200">
          <p class="text-sm font-semibold text-slate-900">Reservations</p>
        </div>
        <div class="rounded-[32px] bg-white px-4 py-5 text-center shadow-xl ring-1 ring-slate-200">
          <p class="text-sm font-semibold text-slate-900">Pharmacy</p>
        </div>
        <div class="rounded-[32px] bg-white px-4 py-5 text-center shadow-xl ring-1 ring-slate-200">
          <p class="text-sm font-semibold text-slate-900">Orders</p>
        </div>
        <div class="rounded-[32px] bg-white px-4 py-5 text-center shadow-xl ring-1 ring-slate-200">
          <p class="text-sm font-semibold text-slate-900">Medicamentos</p>
        </div>
      </section>

      <section class="mt-5 rounded-[32px] bg-white px-5 py-5 shadow-xl ring-1 ring-slate-200 sm:px-6">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-slate-900">Categories</p>
          <span class="text-xs text-slate-400">Ver todo</span>
        </div>
        <img class="mt-4 w-full rounded-[28px] object-cover" src="/img/images categorias.png" alt="Categorías" />
      </section>
    </div>
  </main>
  `;
}

export function renderPatient({ navigate, user }) {
  document.getElementById("app").innerHTML = patientTemplate(user);

  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }

  document.querySelectorAll("#mobileMenu a, #desktopMenu a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const href = link.getAttribute("href");
      if (href) {
        navigate(href);
      }
    });
  });
}
