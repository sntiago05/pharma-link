function landing_depTemplate() {
  return `
    <main class="min-h-screen overflow-x-hidden bg-white text-slate-800">
      <div class="mx-auto flex w-full max-w-none flex-col px-0 py-0 lg:px-0 xl:px-0">
        <header id="landingHeader" class="border-b border-slate-200 bg-white/95 px-6 py-5 shadow-sm lg:px-10 xl:px-16">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <img class="h-12 w-auto" src="/img/image%201.png" alt="Pharma Link logo" />
              <div>
                <div class="text-2xl font-semibold text-teal-900">Pharma<span class="text-lime-600">Link</span></div>
                <div class="text-xs uppercase tracking-[0.25em] text-teal-900">Farmacia</div>
              </div>
            </div>
            <nav class="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700" aria-label="Navegación principal">
              <a href="/register" class="transition hover:text-emerald-600">Sign in</a>
              <a href="/login" class="transition hover:text-emerald-600">Log in</a>
              <a href="#landingFooter" class="transition hover:text-emerald-600">Contact us</a>
            </nav>
            <button id="landingMenuButton" class="inline-flex items-center justify-center rounded-lg p-2 text-teal-900 transition hover:bg-slate-100 lg:hidden" type="button" aria-label="Abrir menú" aria-expanded="false">
              <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <style>
            @media (max-width: 1023px) {
              #landingMenuButton { order: 2; }
              #landingHeader nav { display: none; order: 3; width: 100%; flex-direction: column; align-items: flex-start; gap: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 1rem; }
              #landingHeader nav.is-open { display: flex; }
            }
          </style>
        </header>

        <section class="mt-0 overflow-hidden bg-teal-900 px-6 py-10 lg:px-10 lg:py-14 xl:px-16">
          <div class="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div class="max-w-xl">
              <div class="mb-4 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                <img class="h-6 w-6" src="/img/Back.png" alt="" />
                Centralized reservation system
              </div>
              <h1 class="text-4xl font-semibold leading-tight text-white xl:text-5xl">
                We optimize access to medicines through a centralized booking system.
              </h1>
              <p class="mt-5 max-w-lg text-lg text-slate-200">
                A reliable platform that connects laboratories, distributors, pharmacies and patients in one place.
              </p>
            </div>
            <div class="flex justify-center">
              <img class="w-full max-w-[420px] rounded-[1.5rem] object-cover shadow-2xl" src="/img/image%2014.png" alt="Plataforma Pharma Link" />
            </div>
          </div>
        </section>

        <section class="mt-8 grid gap-6 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 xl:px-16">
          <div class="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <h2 class="text-3xl font-semibold text-teal-900">Ensuring supply</h2>
            <p class="mt-3 text-xl text-emerald-600">Eliminating stockouts of healthcare products.</p>
          </div>
          <div class="grid gap-4 md:grid-cols-4">
            <div class="rounded-[1.5rem] bg-emerald-700 p-6 text-center text-white">
              <div class="text-4xl font-semibold">100K</div>
              <div class="mt-2 text-sm">Streamlined reservations</div>
            </div>
            <div class="rounded-[1.5rem] bg-emerald-700 p-6 text-center text-white">
              <div class="text-4xl font-semibold">10K</div>
              <div class="mt-2 text-sm">Outstanding deliveries</div>
            </div>
            <div class="rounded-[1.5rem] bg-emerald-700 p-6 text-center text-white">
              <div class="text-4xl font-semibold">1M</div>
              <div class="mt-2 text-sm">Customer success</div>
            </div>
            <div class="rounded-[1.5rem] bg-emerald-700 p-6 text-center text-white">
              <div class="text-4xl font-semibold">2.5k</div>
              <div class="mt-2 text-sm">Enhanced control</div>
            </div>
          </div>
        </section>

        <section class="mt-12 px-6 lg:px-10 xl:px-16">
          <div class="mx-auto mb-6 flex max-w-7xl items-center gap-4">
            <h3 class="text-2xl font-semibold text-emerald-600">Useful information</h3>
            <div class="h-[2px] flex-1 rounded-full bg-teal-900"></div>
          </div>
          <div class="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article class="flex items-start gap-4 rounded-[1.5rem] bg-teal-900 p-5 text-white shadow-sm">
              <img class="h-12 w-12" src="/img/Hand%20With%20Smartphone.png" alt="" />
              <div>
                <h4 class="font-semibold">Pending Shipments</h4>
                <p class="mt-2 text-sm text-slate-200">Track the status of your backordered medicines.</p>
              </div>
            </article>
            <article class="flex items-start gap-4 rounded-[1.5rem] bg-teal-900 p-5 text-white shadow-sm">
              <img class="h-12 w-12" src="/img/Wrench.png" alt="" />
              <div>
                <h4 class="font-semibold">Help Center</h4>
                <p class="mt-2 text-sm text-slate-200">Find answers to common questions and contact us easily.</p>
              </div>
            </article>
            <article class="flex items-start gap-4 rounded-[1.5rem] bg-teal-900 p-5 text-white shadow-sm">
              <img class="h-12 w-12" src="/img/Available%20Updates.png" alt="" />
              <div>
                <h4 class="font-semibold">Profile Update</h4>
                <p class="mt-2 text-sm text-slate-200">Update your information with your documents.</p>
              </div>
            </article>
            <article class="flex items-start gap-4 rounded-[1.5rem] bg-teal-900 p-5 text-white shadow-sm">
              <img class="h-12 w-12" src="/img/Doctors%20Folder.png" alt="" />
              <div>
                <h4 class="font-semibold">Medicine Reservations Management</h4>
                <p class="mt-2 text-sm text-slate-200">Guarantee availability of essential treatments through our smart system.</p>
              </div>
            </article>
            <article class="flex items-start gap-4 rounded-[1.5rem] bg-teal-900 p-5 text-white shadow-sm">
              <img class="h-12 w-12" src="/img/Holding%20Box.png" alt="" />
              <div>
                <h4 class="font-semibold">Immediate delivery</h4>
                <p class="mt-2 text-sm text-slate-200">Fast distribution of critical medicines.</p>
              </div>
            </article>
            <article class="flex items-start gap-4 rounded-[1.5rem] bg-teal-900 p-5 text-white shadow-sm">
              <img class="h-12 w-12" src="/img/Message%20Bot.png" alt="" />
              <div>
                <h4 class="font-semibold">100% digital process</h4>
                <p class="mt-2 text-sm text-slate-200">From reservation to verification, everything happens online.</p>
              </div>
            </article>
          </div>
        </section>

        <section class="mt-12 mx-6 rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm lg:mx-10 xl:mx-16 lg:grid-cols-[0.95fr_1.05fr] lg:grid lg:px-10">
          <div>
            <h3 class="text-4xl font-semibold text-emerald-700">About us</h3>
            <p class="mt-5 text-lg leading-8 text-slate-700">
              At Pharma Link, we are the digital platform connecting laboratories, distributors and pharmacies to transform healthcare supply management. Through advanced technology and a centralized reservation system, we ensure essential medicines reach those who need them most—fast, transparently and with zero paperwork.
            </p>
          </div>
          <div class="flex justify-center">
            <img class="w-full max-w-[560px] rounded-[1.5rem] object-cover" src="/img/image%2015.png" alt="Equipo Pharma Link" />
          </div>
        </section>

        <footer id="landingFooter" class="mt-12 flex flex-col overflow-hidden bg-emerald-700 px-6 py-10 text-white lg:px-10 xl:px-16">
          <div class="mx-auto w-full max-w-7xl flex-1 grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div class="max-w-md">
              <div class="flex items-center gap-3">
                <img class="h-16 w-auto" src="/img/image%201.png" alt="Pharma Link logo" />
                <div>
                  <div class="text-3xl font-semibold">Pharma<span class="text-lime-200">Link</span></div>
                  <div class="text-sm uppercase tracking-[0.25em]">Farmacia</div>
                </div>
              </div>
            </div>
            <div class="space-y-6">
              <div>
                <h4 class="text-2xl font-semibold">Our Main Headquarters</h4>
                <p class="mt-2 text-emerald-50">Barranquilla: Calle 105 N° 14 - 140 Zona Industrial de Occidente</p>
              </div>
              <div class="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 class="text-xl font-semibold">Contact Channels</h4>
                  <p class="mt-2 text-emerald-50">From any mobile or landline: +57 601 9169338<br />Toll-Free Nationwide Line: 018000 112 554</p>
                </div>
                <div>
                  <h4 class="text-xl font-semibold">Business Hours</h4>
                  <p class="mt-2 text-emerald-50">Mon - Thu: 7:00 a.m. to 5:30 p.m.<br />Fri: 7:00 a.m. to 4:30 p.m.</p>
                </div>
              </div>
              <div>
                <h4 class="text-xl font-semibold">Employment Verification</h4>
                <p class="mt-2 text-emerald-50">Phone numbers: +57 313 409 5210 - +57 315 505 2246</p>
              </div>
              <div>
                <h4 class="text-xl font-semibold">Employment Documents Requests</h4>
                <p class="mt-2 text-emerald-50">employmentcertificates@pharmalink.com.co</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  `;
}

export function renderLandingDep({ navigate, user }) {
  document.getElementById("app").innerHTML = landing_depTemplate(user);

  const menuButton = document.getElementById("landingMenuButton");
  const navigation = document.querySelector("#landingHeader nav");

  menuButton.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  });

  document.getElementById("app").addEventListener("click", (event) => {
    if (!navigation.classList.contains("is-open") || navigation.contains(event.target) || menuButton.contains(event.target)) return;

    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menú");
  });
}
