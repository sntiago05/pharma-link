import { resetPassword } from "../../services/auth.js";

/**
 * Step 2 of the password reset: set the new password.
 *
 * Only reachable from the emailed link, which carries `?token=`. That token is
 * what proves the visitor controls the address, so this is the first point where
 * asking for a password is safe.
 */

/** Eye toggle, matching the mockup's password field. */
function passwordField({ id, label, placeholder, autocomplete }) {
  return `
    <div class="space-y-2">
      <label for="${id}" class="block text-sm font-medium text-slate-700">${label}</label>
      <div class="relative">
        <input
          id="${id}"
          name="${id}"
          type="password"
          autocomplete="${autocomplete}"
          placeholder="${placeholder}"
          required
          class="w-full rounded-sm border border-neutral-300 bg-transparent px-3 py-3 pr-12 text-sm text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        />
        <button
          type="button"
          data-toggle="${id}"
          class="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400 transition hover:text-slate-600"
          aria-label="Mostrar u ocultar la contraseña"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </div>
  `;
}

function shell(content) {
  return `
  <main class="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
    <a href="/login" class="absolute left-4 top-4 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-slate-100 sm:left-6 sm:top-6" aria-label="Volver a iniciar sesión">
      <img class="h-7 w-7" src="/img/Back.png" alt="" />
    </a>
    <section class="relative w-full max-w-[390px] overflow-hidden lg:max-w-[700px] lg:rounded-[32px] lg:bg-white lg:px-6 lg:py-8 lg:shadow-xl lg:ring-1 lg:ring-slate-200">
      <header class="mb-10 text-center">
        <img src="/img/logo%20horizontal.png" alt="Pharma Link logo" class="mx-auto h-14 w-26" />
      </header>

      <div class="mb-10 flex justify-center">
        <img
          src="/img/loginImg.png"
          alt="Ilustración de salud y farmacia"
          class="h-44 w-44 rounded-full bg-slate-100 object-cover"
        />
      </div>

      ${content}
    </section>
  </main>
  `;
}

/** Shown when the URL has no token at all: the link was mangled or typed by hand. */
function missingTokenTemplate() {
  return shell(`
    <div class="text-center">
      <h1 class="text-2xl font-semibold text-slate-900">Enlace incompleto</h1>
      <p class="mt-2 text-sm text-slate-500">
        Abre el enlace tal como llegó a tu correo, o solicita uno nuevo.
      </p>
      <a href="/forgot-password" class="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[28px] bg-gradient-to-r from-[#0D4D44] to-[#059E3E] text-sm font-semibold text-white shadow-lg shadow-emerald-900/10">
        SOLICITAR ENLACE NUEVO
      </a>
    </div>
  `);
}

function formTemplate() {
  return shell(`
    <div class="mb-8 text-center">
      <h1 class="text-2xl font-semibold text-slate-900">Nueva contraseña</h1>
      <p class="mt-2 text-sm text-slate-500">Debe tener al menos 8 caracteres.</p>
    </div>

    <form id="resetForm" class="space-y-5" method="post" novalidate>
      ${passwordField({
        id: "password",
        label: "Password",
        placeholder: "Crea tu nueva contraseña",
        autocomplete: "new-password"
      })}
      ${passwordField({
        id: "confirmPassword",
        label: "Confirm password",
        placeholder: "Repite la contraseña",
        autocomplete: "new-password"
      })}

      <button
        id="submitButton"
        type="submit"
        class="flex h-12 w-full items-center justify-center rounded-[28px] bg-gradient-to-r from-[#0D4D44] to-[#059E3E] text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:opacity-95 disabled:opacity-60"
      >
        ENTER
      </button>

      <p id="errorMessage" class="min-h-5 text-center text-sm font-medium text-red-600"></p>
    </form>
  `);
}

function doneTemplate() {
  return shell(`
    <div class="text-center">
      <h1 class="text-2xl font-semibold text-slate-900">Contraseña actualizada</h1>
      <p class="mt-2 text-sm text-slate-500">Ya puedes iniciar sesión con tu nueva contraseña.</p>
      <a href="/login" class="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[28px] bg-gradient-to-r from-[#0D4D44] to-[#059E3E] text-sm font-semibold text-white shadow-lg shadow-emerald-900/10">
        INICIAR SESIÓN
      </a>
    </div>
  `);
}

/** Wires every eye toggle on the page. */
function bindPasswordToggles() {
  document.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.toggle);
      input.type = input.type === "password" ? "text" : "password";
    });
  });
}

export function renderResetPassword({ navigate }) {
  const token = new URLSearchParams(window.location.search).get("token");

  if (!token) {
    document.getElementById("app").innerHTML = missingTokenTemplate();
    return;
  }

  document.getElementById("app").innerHTML = formTemplate();
  bindPasswordToggles();

  const form = document.getElementById("resetForm");
  const errorMessage = document.getElementById("errorMessage");
  const submitButton = document.getElementById("submitButton");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    errorMessage.textContent = "";

    // Checked here rather than server-side: the confirmation exists to catch a
    // typo, and the backend has no use for a second copy of the password.
    if (password !== confirmPassword) {
      errorMessage.textContent = "Las contraseñas no coinciden.";
      return;
    }

    if (password.length < 8) {
      errorMessage.textContent = "La contraseña debe tener al menos 8 caracteres.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "GUARDANDO...";

    const result = await resetPassword({ token, password });

    if (!result.success) {
      errorMessage.textContent = result.message;
      submitButton.disabled = false;
      submitButton.textContent = "ENTER";
      return;
    }

    document.getElementById("app").innerHTML = doneTemplate();

    // Drop the token from the address bar so it does not linger in history.
    history.replaceState(null, null, "/reset-password");
  });
}
