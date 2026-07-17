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

export function inputField({ id, label, type = "text", autocomplete = "", placeholder = "", required = true }) {
  return `
    <div>
      <label for="${id}" class="mb-2 block text-sm font-semibold text-slate-700">${label}</label>
      <input
        id="${id}"
        type="${type}"
        ${autocomplete ? `autocomplete="${autocomplete}"` : ""}
        ${placeholder ? `placeholder="${placeholder}"` : ""}
        ${required ? "required" : ""}
        class="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
      >
    </div>
  `;
}

export function roleShell({ title, subtitle, navItems = [], content, sideContent }) {
  const navHtml = navItems.length
    ? `<nav class="hidden flex-wrap justify-center gap-2 sm:flex">${navItems
        .map(({ label, href, active = false }) => {
          return `
            <a href="${href}" class="rounded-full border px-3 py-2 text-sm font-medium transition ${active ? "border-[#0D4D44] bg-[#0D4D44] text-white shadow-sm" : "border-emerald-100 bg-emerald-50/60 text-[#0D4D44] hover:border-emerald-300 hover:bg-emerald-100"}">
              ${label}
            </a>`;
        })
        .join("")}<button type="button" data-logout-button class="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100">Cerrar sesión</button></nav>
        <details class="relative sm:hidden">
          <summary class="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-[#0D4D44] transition hover:bg-emerald-100" aria-label="Abrir menú de navegación">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </summary>
          <nav class="absolute right-0 z-10 mt-2 flex w-52 flex-col gap-2 rounded-[20px] border border-emerald-100 bg-white p-3 shadow-xl shadow-emerald-950/15">${navItems
            .map(({ label, href, active = false }) => {
              return `<a href="${href}" class="rounded-xl px-3 py-2 text-sm font-medium transition ${active ? "bg-[#0D4D44] text-white" : "bg-emerald-50 text-[#0D4D44] hover:bg-emerald-100"}">${label}</a>`;
            })
            .join("")}<button type="button" data-logout-button class="rounded-xl bg-red-50 px-3 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-100">Cerrar sesión</button></nav>
        </details>`
    : "";

  return `
    <main class="min-h-screen bg-[#eef8f4] text-slate-900">
      <header class="w-full border-b border-emerald-100 bg-white px-4 py-4 shadow-sm sm:px-6 lg:px-8">
        <div class="mx-auto flex w-full max-w-7xl items-start justify-between gap-4">
          <div class="flex min-w-0 items-center gap-4">
              <img src="/img/image%201.png" alt="Pharma Link logo" class="h-12 w-auto shrink-0 sm:hidden" />
              <img src="/img/logo%20horizontal.png" alt="Pharma Link logo" class="hidden h-[63px] w-[182px] shrink-0 sm:block" />
            <div class="min-w-0">
              <h1 class="mt-1 text-2xl font-semibold text-[#0D4D44]">${title}</h1>
              <p class="mt-1 text-sm text-slate-500">${subtitle}</p>
            </div>
          </div>
          ${navHtml}
        </div>
      </header>
      <section class="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:px-8">
        <aside class="order-1 w-full rounded-[32px] border border-emerald-100 bg-white p-4 shadow-xl shadow-emerald-950/10 sm:p-6 lg:max-w-sm">
          ${sideContent}
        </aside>

        <div class="order-2 w-full rounded-[32px] border border-emerald-100 bg-white p-4 shadow-xl shadow-emerald-950/10 sm:p-6 lg:order-2 lg:flex-1">
          ${content}
        </div>
      </section>
    </main>
  `;
}

export function statCard(label, value, hint) {
  return `
    <article class="rounded-[24px] border border-emerald-700 bg-emerald-700 p-4 shadow-sm shadow-emerald-900/20">
      <p class="text-sm font-semibold text-emerald-50">${label}</p>
      <p class="mt-3 text-2xl font-semibold text-white">${value}</p>
      <p class="mt-2 text-sm text-emerald-100">${hint}</p>
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
    <div class="flex items-center justify-between rounded-[20px] bg-emerald-50/60 px-4 py-3">
      <span class="text-sm text-slate-600">${label}</span>
      <span class="text-sm font-semibold text-[#0D4D44]">${value}</span>
    </div>
  `;
}

/* --------------------------------------------------------------------------
 * Helpers added to render live API data with the existing design language.
 * ------------------------------------------------------------------------ */

/**
 * Escapes text before it goes into a template literal.
 *
 * Every view builds HTML with string interpolation, so any value coming from the
 * API (patient names, medicine names, API error messages) must be escaped or it
 * is an XSS vector. Use this for ALL untrusted text.
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Placeholder shown while a section is fetching. */
export function loadingState(message = "Cargando...") {
  return `
    <div class="flex items-center justify-center gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-10">
      <span class="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></span>
      <p class="text-sm text-slate-500">${escapeHtml(message)}</p>
    </div>
  `;
}

/** Failure state with an optional retry button (`data-retry`). */
export function errorState(message, { retry = true } = {}) {
  return `
    <div class="rounded-[24px] border border-red-200 bg-red-50 px-4 py-6 text-center">
      <p class="text-sm font-semibold text-red-700">${escapeHtml(message)}</p>
      ${retry ? `<button type="button" data-retry class="mt-3 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">Reintentar</button>` : ""}
    </div>
  `;
}

/** Neutral "nothing here yet" state. */
export function emptyState(message, hint = "") {
  return `
    <div class="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
      <p class="text-sm font-semibold text-slate-600">${escapeHtml(message)}</p>
      ${hint ? `<p class="mt-1 text-sm text-slate-400">${escapeHtml(hint)}</p>` : ""}
    </div>
  `;
}

export function primaryButton(label, { id = "", type = "button", attrs = "", full = false } = {}) {
  return `
    <button ${id ? `id="${id}"` : ""} type="${type}" ${attrs}
      class="${full ? "w-full " : ""}rounded-full bg-gradient-to-r from-[#0D4D44] to-[#059E3E] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
      ${label}
    </button>
  `;
}

export function secondaryButton(label, { attrs = "", tone = "slate" } = {}) {
  const tones = {
    slate: "border-slate-300 text-slate-700 hover:border-slate-400",
    red: "border-red-300 text-red-700 hover:border-red-400",
    emerald: "border-emerald-300 text-emerald-700 hover:border-emerald-500"
  };
  return `
    <button type="button" ${attrs}
      class="rounded-full border bg-white px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone] || tones.slate}">
      ${label}
    </button>
  `;
}

export function selectField({ id, label, options, value = "", placeholder = "Selecciona una opción" }) {
  return `
    <div>
      <label for="${id}" class="mb-2 block text-sm font-semibold text-slate-700">${escapeHtml(label)}</label>
      <select id="${id}" name="${id}"
        class="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100">
        <option value="">${escapeHtml(placeholder)}</option>
        ${options
          .map(
            (option) =>
              `<option value="${escapeHtml(option.value)}" ${String(option.value) === String(value) ? "selected" : ""}>${escapeHtml(option.label)}</option>`
          )
          .join("")}
      </select>
    </div>
  `;
}

export function textField({ id, label, type = "text", value = "", placeholder = "", required = true, min = "", step = "" }) {
  return `
    <div>
      <label for="${id}" class="mb-2 block text-sm font-semibold text-slate-700">${escapeHtml(label)}</label>
      <input id="${id}" name="${id}" type="${type}" value="${escapeHtml(value)}"
        ${placeholder ? `placeholder="${escapeHtml(placeholder)}"` : ""}
        ${min !== "" ? `min="${min}"` : ""} ${step !== "" ? `step="${step}"` : ""} ${required ? "required" : ""}
        class="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100">
    </div>
  `;
}

/** Scrollable table. Cells must already be escaped by the caller. */
export function dataTable({ headers, rows }) {
  if (!rows.length) return emptyState("Sin registros para mostrar.");

  return `
    <div class="overflow-x-auto rounded-[20px] border border-emerald-100">
      <table class="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead class="bg-[#0D4D44]">
          <tr>${headers.map((header) => `<th class="px-4 py-3 font-semibold text-white">${escapeHtml(header)}</th>`).join("")}</tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${rows.map((cells) => `<tr class="hover:bg-slate-50">${cells.map((cell) => `<td class="px-4 py-3 text-slate-700">${cell}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/** Section wrapper matching the card style used across the panels. */
export function panel({ title, action = "", body }) {
  return `
    <section class="mt-5 rounded-[28px] border border-emerald-800 bg-emerald-700 p-4 shadow-sm shadow-emerald-900/20">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm font-semibold text-white">${escapeHtml(title)}</p>
        ${action}
      </div>
      <div class="mt-4 rounded-[20px] bg-emerald-500 p-4">${body}</div>
    </section>
  `;
}

export function promoCard({ title, subtitle, buttonLabel, buttonHref, image, imageAlt = "" }) {
  return `
    <section class="mt-5 overflow-hidden rounded-[32px] bg-emerald-700 text-white shadow-xl shadow-emerald-900/10 ring-1 ring-emerald-900/10">
      <div class="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
        <div>
          <p class="text-3xl font-semibold leading-tight">${escapeHtml(title)}</p>
          <p class="mt-3 max-w-xl text-sm text-emerald-100">${escapeHtml(subtitle)}</p>
          <a href="${escapeHtml(buttonHref)}" class="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-slate-100">
            ${escapeHtml(buttonLabel)}
          </a>
        </div>
        ${image ? `<div class="flex justify-center lg:justify-end"><img src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}" class="max-h-48 w-full max-w-[260px] object-contain" /></div>` : ""}
      </div>
    </section>
  `;
}

/** Tone for a reservation/order status badge. */
export function statusTone(status) {
  return (
    {
      PENDING: "amber",
      RESERVED: "emerald",
      DELIVERED: "emerald",
      COMPLETED: "emerald",
      CANCELLED: "red",
      EXPIRED: "red",
      NO_SHOW: "red"
    }[status] || "slate"
  );
}

/** Spanish label for a status code. */
export function statusLabel(status) {
  return (
    {
      PENDING: "Pendiente",
      RESERVED: "Reservada",
      DELIVERED: "Entregada",
      COMPLETED: "Completada",
      CANCELLED: "Cancelada",
      EXPIRED: "Vencida",
      NO_SHOW: "No asistió"
    }[status] || status
  );
}

/** Transient feedback message, auto-dismissed. */
export function toast(message, tone = "emerald") {
  const tones = {
    emerald: "bg-emerald-600",
    red: "bg-red-600",
    slate: "bg-slate-800"
  };

  const node = document.createElement("div");
  node.className = `fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg ${tones[tone] || tones.emerald}`;
  node.textContent = message;
  document.body.appendChild(node);

  setTimeout(() => node.remove(), 3200);
}

/**
 * Formats `YYYY-MM-DD` or an ISO timestamp as `DD/MM/YYYY`.
 *
 * Timestamps are converted to local time first. Slicing the ISO string instead
 * would report the UTC day, so anything created after 19:00 in Colombia (UTC-5)
 * would display as the following date.
 *
 * Plain `YYYY-MM-DD` values are formatted as written: they are civil dates
 * (reservation_date, expiration_date) with no timezone, and parsing them as
 * Dates would treat them as UTC midnight and shift them a day back.
 */
export function formatDate(value) {
  if (!value) return "-";

  const raw = String(value);
  const iso = raw.includes("T")
    ? (() => {
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) return raw.slice(0, 10);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      })()
    : raw.slice(0, 10);

  const [year, month, day] = iso.split("-");
  return year && month && day ? `${day}/${month}/${year}` : iso;
}

/** Trims `HH:MM:SS` to `HH:MM`. */
export function formatTime(value) {
  return value ? String(value).slice(0, 5) : "-";
}
