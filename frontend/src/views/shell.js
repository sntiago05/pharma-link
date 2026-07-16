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
    <div class="rounded-[24px] bg-slate-50 p-4">
      <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">${escapeHtml(roleLabel(user.role))}</p>
      <h2 class="mt-2 text-lg font-semibold text-slate-900">${escapeHtml(user.fullName || user.email)}</h2>
      <p class="mt-1 text-sm text-slate-500">${escapeHtml(user.email)}</p>
      ${org ? `<p class="mt-2 text-sm font-medium text-emerald-700">${escapeHtml(org)}</p>` : ""}
      ${extraLines.map((line) => `<p class="mt-2 text-sm text-slate-600">${escapeHtml(line)}</p>`).join("")}
      <button id="logoutButton" type="button"
        class="mt-4 w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:text-red-600">
        Cerrar sesión
      </button>
    </div>
  `;
}

/** Wires the logout button rendered by {@link userCard}. */
export function bindLogout(navigate) {
  const button = document.getElementById("logoutButton");
  if (!button) return;

  button.addEventListener("click", () => {
    logout();
    navigate("/login", { replace: true });
  });
}

/** Quick-link list for the side column. */
export function quickLinks(links) {
  return `
    <div class="mt-4 rounded-[24px] border border-slate-200 p-4">
      <p class="text-sm font-semibold text-slate-900">Accesos rápidos</p>
      <div class="mt-3 space-y-2">
        ${links
          .map(
            (link) =>
              `<a href="${link.href}" class="block rounded-[20px] bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700">${escapeHtml(link.label)}</a>`
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
