import { getSession } from "./services/auth.js";
import { renderLanding } from "./views/ladingpage.js";
import { renderLogin } from "./views/loginView.js";
import { renderProfile } from "./views/profileView.js";
import { renderRegister } from "./views/registerView.js";
import { renderPatientDashboard } from "./views/patientRoutesView.js";
import { adminView } from "./views/admin_view.js";
import { renderWelcome } from "./views/welcomePage.js";
import { renderOrders } from "./views/ordersView.js";
import { renderEpsDashboard } from "./views/epsRoutesView.js";
import { renderPharmacyDashboard } from "./views/pharmacyRoutesView.js";
import { renderAdminDashboard } from "./views/adminRoutesView.js";
import { renderNotFound } from "./views/notFoundView.js";

const routes = {
  "/": renderLanding,
  "/welcome": renderWelcome,
  "/login": renderLogin,
  "/register": renderRegister,
  "/profile": renderProfile,
  "/patient": renderPatientDashboard,
  "/orders": renderOrders,
  "/patient/dashboard": renderPatientDashboard,
  "/patient/orders": renderPatientDashboard,
  "/patient/availability": renderPatientDashboard,
  "/patient/pharmacies": renderPatientDashboard,
  "/patient/reservations": renderPatientDashboard,
  "/patient/profile": renderPatientDashboard,
  "/eps/dashboard": renderEpsDashboard,
  "/eps/orders": renderEpsDashboard,
  "/eps/orders/create": renderEpsDashboard,
  "/eps/orders/history": renderEpsDashboard,
  "/eps/profile": renderEpsDashboard,
  "/pharmacy/dashboard": renderPharmacyDashboard,
  "/pharmacy/inventory": renderPharmacyDashboard,
  "/pharmacy/reservations": renderPharmacyDashboard,
  "/pharmacy/deliveries": renderPharmacyDashboard,
  "/pharmacy/orders": renderPharmacyDashboard,
  "/pharmacy/profile": renderPharmacyDashboard,
  "/admin/dashboard": renderAdminDashboard,
  "/admin/users": renderAdminDashboard,
  "/admin/roles": renderAdminDashboard,
  "/admin/eps": renderAdminDashboard,
  "/admin/pharmacies": renderAdminDashboard,
  "/admin/medicines": renderAdminDashboard,
  "/admin/profile": renderAdminDashboard,
  "/admin": adminView
};

function normalizePath(pathname) {
  return pathname && pathname !== "/" ? pathname.replace(/\/+$/, "") || "/" : "/";
}

function resolveRoute(pathname, user) {
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath.startsWith("/patient/order/")) {
    return renderPatientDashboard;
  }

  if (normalizedPath.startsWith("/patient/")) {
    return routes[normalizedPath] || renderPatientDashboard;
  }

  if (normalizedPath.startsWith("/eps/")) {
    return routes[normalizedPath] || renderEpsDashboard;
  }

  if (normalizedPath.startsWith("/pharmacy/")) {
    return routes[normalizedPath] || renderPharmacyDashboard;
  }

  if (normalizedPath.startsWith("/admin/")) {
    return routes[normalizedPath] || renderAdminDashboard;
  }

  if (user?.role === "ADMIN") {
    return routes[normalizedPath] || renderAdminDashboard;
  }

  if (user?.role === "USUARIO") {
    return routes[normalizedPath] || renderPatientDashboard;
  }

  return routes[normalizedPath] || renderNotFound;
}

function navigate(path) {
  history.pushState(null, null, path);
  renderRoute();
}

function renderRoute() {
  const user = getSession();
  const currentPath = normalizePath(window.location.pathname || (user ? "/profile" : "/login"));

  if (currentPath === "/profile" && !user) {
    history.replaceState(null, null, "/login");
    renderRoute();
    return;
  }

  if (currentPath === "/" && user) {
    const redirectPath = user.role === "ADMIN" ? "/admin/dashboard" : "/patient/dashboard";
    history.replaceState(null, null, redirectPath);
    renderRoute();
    return;
  }

  if ((currentPath === "/login" || currentPath === "/register") && user) {
    const redirectPath = user.role === "ADMIN" ? "/admin/dashboard" : "/patient/dashboard";
    history.replaceState(null, null, redirectPath);
    renderRoute();
    return;
  }

  if (currentPath === "/admin" && (!user || user.role !== "ADMIN")) {
    history.replaceState(null, null, "/login");
    renderRoute();
    return;
  }

  const route = resolveRoute(currentPath, user);
  route({ navigate, user, currentPath });
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
