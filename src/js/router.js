import { getSession } from "./auth.js";
import { renderLogin } from "./views/loginView.js";
import { renderProfile } from "./views/profileView.js";
import { renderRegister } from "./views/registerView.js";

const routes = {
  "#/login": renderLogin,
  "#/register": renderRegister,
  "#/profile": renderProfile
};

function navigate(path) {
  window.location.hash = path;
}

function renderRoute() {
  const user = getSession();
  const currentPath = window.location.hash || (user ? "#/profile" : "#/login");

  if (currentPath === "#/profile" && !user) {
    navigate("#/login");
    return;
  }

  if ((currentPath === "#/login" || currentPath === "#/register") && user) {
    navigate("#/profile");
    return;
  }

  const route = routes[currentPath] || renderLogin;
  route({ navigate, user });
}

export function startRouter() {
  window.addEventListener("hashchange", renderRoute);
  renderRoute();
}
