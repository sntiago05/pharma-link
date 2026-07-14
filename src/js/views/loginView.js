import { login, saveSession } from "../auth.js";
import { authShell, brandHeader, inputField } from "./components.js";

function loginTemplate() {
  return authShell(`
    ${brandHeader()}

    <section class="mt-10 text-center">
      <h1 class="text-3xl font-extrabold text-[#0D4D44]">Iniciar sesion</h1>
      <p class="mt-2 text-sm text-slate-500">Ingresa a tu cuenta de Pharma Link</p>
    </section>

    <form id="loginForm" class="mt-8 space-y-5">
      ${inputField({
        id: "email",
        label: "Email",
        type: "email",
        autocomplete: "email"
      })}

      ${inputField({
        id: "password",
        label: "Contrasena",
        type: "password",
        autocomplete: "current-password"
      })}

      <button
        type="submit"
        class="w-full rounded-lg bg-[#0D4D44] px-4 py-3 text-base font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200"
      >
        Entrar
      </button>

      <p id="errorMessage" class="min-h-5 text-center text-sm font-medium text-red-600"></p>
    </form>

    <footer class="mt-6 text-center text-sm text-slate-500">
      No tienes cuenta?
      <a href="#/register" class="font-bold text-[#0D4D44] hover:text-[#59B13F]">Crear cuenta</a>
    </footer>
  `);
}

export function renderLogin({ navigate }) {
  document.getElementById("app").innerHTML = loginTemplate();

  document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("errorMessage");
    const result = login(email, password);

    if (!result.success) {
      errorMessage.textContent = result.message;
      return;
    }

    saveSession(result.user);
    navigate("#/profile");
  });
}
