import { getSession } from "./services/session.js";
import { canAccess, homeFor } from "./services/roles.js";
import { renderLanding } from "./views/landing/ladingpage.js";
import { renderLandingDep } from "./views/landing/landingpage_dep.js";
import { renderLogin } from "./views/login/loginView.js";
import { renderProfile } from "./views/profile/profileView.js";
import { renderRegister } from "./views/register/registerView.js";
import { renderPatientDashboard } from "./views/patient/patientRoutesView.js";
import { renderWelcome } from "./views/welcome/welcomePage.js";
import { renderEpsDashboard } from "./views/eps/epsRoutesView.js";
import { renderPharmacyDashboard } from "./views/pharmacy/pharmacyRoutesView.js";
import { renderAdminDashboard } from "./views/admin/adminRoutesView.js";
import { renderNotFound } from "./views/notFound/notFoundView.js";

/**
 * Client-side router.
 *
 * Each role owns a URL prefix and one view function that switches on the path,
 * which is why several routes map to the same renderer.
 */

const PUBLIC_ROUTES = new Set(["/", "/landing-dep", "/login", "/register", "/welcome"]);

const routes = {
  "/": renderLandingDep,
  "/landing": renderLanding,
  "/welcome": renderWelcome,
  "/login": renderLogin,
  "/register": renderRegister,
  "/profile": renderProfile,

  "/patient": renderPatientDashboard,
  "/patient/dashboard": renderPatientDashboard,
  "/patient/orders": renderPatientDashboard,
  "/patient/availability": renderPatientDashboard,
  "/patient/reservations": renderPatientDashboard,
  "/patient/notifications": renderPatientDashboard,
  "/patient/profile": renderPatientDashboard,

  "/pharmacy": renderPharmacyDashboard,
  "/pharmacy/dashboard": renderPharmacyDashboard,
  "/pharmacy/inventory": renderPharmacyDashboard,
  "/pharmacy/reservations": renderPharmacyDashboard,
  "/pharmacy/deliveries": renderPharmacyDashboard,
  "/pharmacy/notifications": renderPharmacyDashboard,
  "/pharmacy/profile": renderPharmacyDashboard,

  "/eps": renderEpsDashboard,
  "/eps/dashboard": renderEpsDashboard,
  "/eps/orders": renderEpsDashboard,
  "/eps/orders/create": renderEpsDashboard,
  "/eps/profile": renderEpsDashboard,

  "/admin": renderAdminDashboard,
  "/admin/dashboard": renderAdminDashboard,
  "/admin/eps": renderAdminDashboard,
  "/admin/pharmacies": renderAdminDashboard,
  "/admin/medicines": renderAdminDashboard,
  "/admin/users": renderAdminDashboard,
  "/admin/audit": renderAdminDashboard,
  "/admin/profile": renderAdminDashboard
};

function normalizePath(pathname) {
  return pathname && pathname !== "/" ? pathname.replace(/\/+$/, "") || "/" : "/";
}

/** Resolves the view for a path, falling back to the section's own dashboard. */
function resolveRoute(pathname) {
  if (routes[pathname]) return routes[pathname];

  const fallbacks = [
    ["/patient/", renderPatientDashboard],
    ["/pharmacy/", renderPharmacyDashboard],
    ["/eps/", renderEpsDashboard],
    ["/admin/", renderAdminDashboard]
  ];

  const match = fallbacks.find(([prefix]) => pathname.startsWith(prefix));
  return match ? match[1] : renderNotFound;
}

function navigate(path, { replace = false } = {}) {
  if (replace) history.replaceState(null, null, path);
  else history.pushState(null, null, path);
  renderRoute();
}

/**
 * Renders the view for the current URL, applying the auth and role guards.
 *
 * View functions may be async (most fetch their data), so failures are caught
 * here: an unhandled rejection would otherwise leave the user on a blank page.
 */
async function renderRoute() {
  const user = getSession();
  const currentPath = normalizePath(window.location.pathname);

  // Signed out and asking for a private route.
  if (!user && !PUBLIC_ROUTES.has(currentPath)) {
    return navigate("/login", { replace: true });
  }

  // Signed in and sitting on an entry route: go to the role's home.
  if (user && (currentPath === "/login" || currentPath === "/register" || currentPath === "/")) {
    return navigate(homeFor(user.role), { replace: true });
  }

  // Signed in but reaching into another role's section.
  if (user && !canAccess(user.role, currentPath)) {
    return navigate(homeFor(user.role), { replace: true });
  }

  const route = resolveRoute(currentPath);

  try {
    await route({ navigate, user, currentPath });
  } catch (error) {
    // A 401 means the token expired; api.js already cleared the session.
    if (error?.status === 401) return navigate("/login", { replace: true });

    console.error("Error al renderizar la vista:", error);
    document.getElementById("app").innerHTML = `
      <main class="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div class="w-full max-w-md rounded-[28px] bg-white p-6 text-center shadow-xl ring-1 ring-slate-200">
          <h1 class="text-lg font-semibold text-slate-900">No se pudo cargar la vista</h1>
          <p class="mt-2 text-sm text-slate-500">${error?.message || "Error inesperado."}</p>
          <a href="${user ? homeFor(user.role) : "/login"}" class="mt-4 inline-block rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Volver</a>
        </div>
      </main>
    `;
  }
}

export function startRouter() {
  window.addEventListener("popstate", renderRoute);

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || !href.startsWith("/")) return;
    if (link.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    navigate(href);
  });

  renderRoute();
}

export { navigate };
