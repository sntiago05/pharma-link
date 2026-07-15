import { getSession } from "./services/auth.js";
import { renderLanding } from "./views/ladingpage.js";
import { renderLogin } from "./views/loginView.js";
import { renderProfile } from "./views/profileView.js";
import { renderRegister } from "./views/registerView.js";
import { renderPatient } from "./views/patientView.js";
import { adminView } from "./views/admin_view.js";
import { renderWelcome } from "./views/welcomePage.js";

const routes = {
  "/": renderLanding,
  "/welcome": renderWelcome,
  "/login": renderLogin,
  "/register": renderRegister,
  "/profile": renderProfile,
  "/patient": renderPatient,
  "/admin": adminView
};

function navigate(path) {
  history.pushState(null, null, path);
  renderRoute();
}

function renderRoute() {
  const user = getSession();
  const currentPath = window.location.pathname || (user ? "/profile" : "/login");

  if (currentPath === "/profile" && !user) {
    history.replaceState(null, null, "/login");
    renderRoute();
    return;
  }

  if (currentPath === "/" && user) {
    const redirectPath = user.role === "ADMIN" ? "/admin" : "/profile";
    history.replaceState(null, null, redirectPath);
    renderRoute();
    return;
  }

  if ((currentPath === "/login" || currentPath === "/register") && user) {
    const redirectPath = user.role === "ADMIN" ? "/admin" : "/profile";
    history.replaceState(null, null, redirectPath);
    renderRoute();
    return;
  }

  if (currentPath === "/admin" && (!user || user.role !== "ADMIN")) {
    history.replaceState(null, null, "/login");
    renderRoute();
    return;
  }

  const route = routes[currentPath] || renderLogin;
  route({ navigate, user });
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
