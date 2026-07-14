import { registerUser, saveSession } from "../auth.js";
import { authShell, brandHeader, inputField } from "./components.js";

function registerTemplate() {
  return authShell(`
    ${brandHeader()}

    <section class="mt-10 text-center">
      <h1 class="text-3xl font-extrabold text-[#0D4D44]">Crear cuenta</h1>
      <p class="mt-2 text-sm text-slate-500">Registrate para empezar con Pharma Link</p>
    </section>

    <form id="registerForm" class="mt-8 space-y-4">
      ${inputField({
        id: "fullname",
        label: "Nombre completo",
        autocomplete: "name"
      })}

      ${inputField({
        id: "email",
        label: "Email",
        type: "email",
        autocomplete: "email"
      })}

      ${inputField({
        id: "phone",
        label: "Telefono",
        type: "tel",
        autocomplete: "tel"
      })}

      ${inputField({
        id: "password",
        label: "Contrasena",
        type: "password",
        autocomplete: "new-password"
      })}

      ${inputField({
        id: "confirmPassword",
        label: "Confirmar contrasena",
        type: "password",
        autocomplete: "new-password"
      })}

      <label class="flex items-start gap-3 text-sm leading-5 text-slate-600">
        <input id="terms" type="checkbox" required class="mt-1 h-4 w-4 rounded border-slate-300 text-[#0D4D44] focus:ring-emerald-200">
        <span>
          Acepto los
          <a href="#" class="font-semibold text-[#0D4D44] hover:text-[#59B13F]">Terminos y condiciones</a>
          y la
          <a href="#" class="font-semibold text-[#0D4D44] hover:text-[#59B13F]">Politica de privacidad</a>
        </span>
      </label>

      <button
        type="submit"
        class="w-full rounded-lg bg-[#0D4D44] px-4 py-3 text-base font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200"
      >
        Crear cuenta
      </button>

      <p id="errorMessage" class="min-h-5 text-center text-sm font-medium text-red-600"></p>
    </form>

    <footer class="mt-6 text-center text-sm text-slate-500">
      Ya tienes cuenta?
      <a href="#/login" class="font-bold text-[#0D4D44] hover:text-[#59B13F]">Iniciar sesion</a>
    </footer>
  `);
}

export function renderRegister({ navigate }) {
  document.getElementById("app").innerHTML = registerTemplate();

  document.getElementById("registerForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const errorMessage = document.getElementById("errorMessage");

    if (password !== confirmPassword) {
      errorMessage.textContent = "Las contrasenas no coinciden.";
      return;
    }

    const result = registerUser({
      fullname: document.getElementById("fullname").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      password
    });

    if (!result.success) {
      errorMessage.textContent = result.message;
      return;
    }

    saveSession(result.user);
    navigate("#/profile");
  });
}
