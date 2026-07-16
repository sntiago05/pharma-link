export function brandHeader() {
  return `
    <header class="flex items-center justify-center gap-3">
      <div class="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
        <span class="text-2xl font-black text-emerald-700">P</span>
      </div>
      <div>
        <p class="text-2xl font-extrabold leading-none">
          <span class="text-[#0D4D44]">Pharma</span><span class="text-[#59B13F]">Link</span>
        </p>
        <div class="mt-1 flex items-center gap-2 text-[10px] font-semibold tracking-[0.28em] text-slate-400">
          <span class="h-px w-5 bg-slate-300"></span>
          FARMACIA
          <span class="h-px w-5 bg-slate-300"></span>
        </div>
      </div>
    </header>
  `;
}

export function authShell(content) {
  return `
    <main class="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <section class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center">
        <div class="w-full rounded-lg bg-white p-6 shadow-xl shadow-emerald-900/10 ring-1 ring-slate-200 sm:p-8">
          ${content}
        </div>
      </section>
    </main>
  `;
}

export function inputField({ id, label, type = "text", autocomplete = "", required = true }) {
  return `
    <div>
      <label for="${id}" class="mb-2 block text-sm font-semibold text-slate-700">${label}</label>
      <input
        id="${id}"
        type="${type}"
        ${autocomplete ? `autocomplete="${autocomplete}"` : ""}
        ${required ? "required" : ""}
        class="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
      >
    </div>
  `;
}

export function roleShell({ title, subtitle, navItems = [], content, sideContent }) {
  const navHtml = navItems.length
    ? `<nav class="flex flex-wrap gap-2">${navItems
        .map(({ label, href, active = false }) => {
          return `
            <a href="${href}" class="rounded-full border px-3 py-2 text-sm font-medium transition ${active ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"}">
              ${label}
            </a>`;
        })
        .join("")}</nav>`
    : "";

  return `
    <main class="min-h-screen bg-slate-50 px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <section class="mx-auto flex w-full max-w-6xl flex-col gap-4 lg:flex-row lg:items-start">
        <div class="w-full rounded-[32px] bg-white p-4 shadow-xl shadow-emerald-900/10 ring-1 ring-slate-200 sm:p-6 lg:flex-1">
          <header class="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Pharma Link</p>
              <h1 class="mt-1 text-2xl font-semibold text-[#0D4D44]">${title}</h1>
              <p class="mt-1 text-sm text-slate-500">${subtitle}</p>
            </div>
            ${navHtml}
          </header>
          ${content}
        </div>

        <aside class="w-full rounded-[32px] bg-white p-4 shadow-xl shadow-emerald-900/10 ring-1 ring-slate-200 sm:p-6 lg:max-w-sm">
          ${sideContent}
        </aside>
      </section>
    </main>
  `;
}

export function statCard(label, value, hint) {
  return `
    <article class="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <p class="text-sm font-semibold text-slate-700">${label}</p>
      <p class="mt-3 text-2xl font-semibold text-[#0D4D44]">${value}</p>
      <p class="mt-2 text-sm text-slate-500">${hint}</p>
    </article>
  `;
}

export function statusBadge(text, tone = "emerald") {
  const tones = {
    emerald: "bg-emerald-100 text-emerald-700",
    slate: "bg-slate-200 text-slate-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700"
  };

  return `<span class="rounded-full px-3 py-1 text-[11px] font-semibold ${tones[tone] || tones.emerald}">${text}</span>`;
}

export function infoRow(label, value) {
  return `
    <div class="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
      <span class="text-sm text-slate-500">${label}</span>
      <span class="text-sm font-semibold text-slate-900">${value}</span>
    </div>
  `;
}
