import { logout } from "../services/auth.js";
import { getContext } from "../services/session.js";
import { roleLabel } from "../services/roles.js";
import { escapeHtml } from "./components.js";

/**
 * Shared chrome for the role panels.
 *
 * `roleShell` in components.js renders the frame; this adds the pieces every
 * panel needs identically — the signed-in user block and a working logout — so
 * each view does not reimplement them.
 */

/** The side block with the current user and a logout button. */
export function userCard({ user, extraLines = [] }) {
  const context = getContext();
  const org = context?.pharmacy?.name || context?.eps?.name || context?.patient?.epsName;

  return `
    <div class="hidden rounded-[24px] bg-[#0D4D44] p-4 text-white sm:block">
      <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-200">${escapeHtml(roleLabel(user.role))}</p>
      <h2 class="mt-2 text-lg font-semibold text-white">${escapeHtml(user.fullName || user.email)}</h2>
      <p class="mt-1 text-sm text-emerald-50">${escapeHtml(user.email)}</p>
      ${org ? `<p class="mt-2 text-sm font-medium text-lime-200">${escapeHtml(org)}</p>` : ""}
      ${extraLines.map((line) => `<p class="mt-2 text-sm text-emerald-100">${escapeHtml(line)}</p>`).join("")}
      <button id="logoutButton" type="button"
        class="hidden mt-4 w-full rounded-full border border-white/30 bg-white px-4 py-2 text-sm font-semibold text-[#0D4D44] transition hover:bg-emerald-50 hover:text-red-600">
        Cerrar sesión
      </button>
    </div>
  `;
}

/** Wires the logout button rendered by {@link userCard}. */
export function bindLogout(navigate) {
  document.querySelectorAll("[data-logout-button]").forEach((button) => {
    button.addEventListener("click", () => {
      logout();
      navigate("/login", { replace: true });
    });
  });
}

/** Quick-link list for the side column. */
export function quickLinks(links) {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const dashboardHref = `/${pathParts[0]}/dashboard`;
  const isDashboard = window.location.pathname === dashboardHref || window.location.pathname === `/${pathParts[0]}`;

  if (!isDashboard) {
    return `
      <a href="${dashboardHref}" class="mt-4 flex items-center gap-2 rounded-[20px] bg-[#0D4D44] px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800">
        <span aria-hidden="true">←</span> Volver al dashboard
      </a>
    `;
  }

  return `
    <div class="mt-4 rounded-[24px] border border-emerald-800 bg-emerald-700 p-4 shadow-sm shadow-emerald-900/20 [&>p]:text-white">
      <p class="text-sm font-semibold text-slate-900">Accesos rápidos</p>
      <div class="mt-3 space-y-2">
        ${links
          .map(
            (link) =>
              `<a href="${link.href}" class="block rounded-[20px] px-3 py-3 text-sm font-medium transition ${link.active || window.location.pathname === link.href ? "bg-[#0D4D44] text-white shadow-sm" : "bg-white text-slate-700 hover:bg-emerald-100 hover:text-[#0D4D44]"}">${escapeHtml(link.label)}</a>`
          )
          .join("")}
      </div>
    </div>
  `;
}

/**
 * Picks the active section from a path.
 *
 * @param {string} pathname
 * @param {string[]} sections Known section slugs.
 * @param {string} fallback
 */
export function sectionFromPath(pathname, sections, fallback) {
  const match = sections.find((section) => pathname.endsWith(`/${section}`));
  return match || fallback;
}
