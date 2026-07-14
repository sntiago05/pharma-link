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
