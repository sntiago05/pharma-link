import { requestPasswordReset } from "../../services/auth.js";

/**
 * Step 1 of the password reset: ask for the account's email.
 *
 * The mockup put the email and the new password on this one screen. That is not
 * implemented, because it would let anyone who knows a person's address take
 * their account — on PharmaLink that means their medical orders and ID number.
 * The new password is set on the next screen instead, which is only reachable
 * through the single-use link emailed to the address itself. The look of the
 * mockup is kept for both screens.
 */

function forgotPasswordTemplate() {
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

      <div class="mb-8 text-center">
        <h1 class="text-2xl font-semibold text-slate-900">Recover my account</h1>
        <p class="mt-2 text-sm text-slate-500">
          Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.
        </p>
      </div>

      <form id="forgotForm" class="space-y-5" method="post" novalidate>
        <div class="space-y-2">
          <label for="email" class="block text-sm font-medium text-slate-700">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            placeholder="nombre@correo.com"
            required
            class="w-full rounded-sm border border-neutral-300 bg-transparent px-3 py-3 text-sm text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <button
          id="submitButton"
          type="submit"
          class="flex h-12 w-full items-center justify-center rounded-[28px] bg-gradient-to-r from-[#0D4D44] to-[#059E3E] text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:opacity-95 disabled:opacity-60"
        >
          ENTER
        </button>

        <p id="errorMessage" class="min-h-5 text-center text-sm font-medium text-red-600"></p>
      </form>

      <div id="sentPanel" class="hidden rounded-[20px] bg-emerald-50 p-5 text-center ring-1 ring-emerald-100">
        <p class="text-sm font-semibold text-emerald-900">Revisa tu correo</p>
        <p class="mt-2 text-sm text-emerald-800">
          Si <span id="sentEmail" class="font-semibold"></span> corresponde a una cuenta, te enviamos un
          enlace para crear una contraseña nueva. Caduca en 60 minutos.
        </p>
        <p class="mt-3 text-xs text-emerald-700">¿No llegó? Revisa spam o vuelve a intentarlo en unos minutos.</p>
        <a href="/login" class="mt-4 inline-block text-sm font-semibold text-emerald-800 hover:text-emerald-600">
          Volver a iniciar sesión
        </a>
      </div>

      <p id="loginHint" class="mt-6 text-center text-sm text-slate-500">
        ¿Ya la recordaste?
        <a href="/login" class="font-semibold text-emerald-800 hover:text-emerald-600">Inicia sesión</a>
      </p>
    </section>
  </main>
  `;
}

export function renderForgotPassword() {
  document.getElementById("app").innerHTML = forgotPasswordTemplate();

  const form = document.getElementById("forgotForm");
  const errorMessage = document.getElementById("errorMessage");
  const submitButton = document.getElementById("submitButton");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();

    errorMessage.textContent = "";
    submitButton.disabled = true;
    submitButton.textContent = "ENVIANDO...";

    const result = await requestPasswordReset(email);

    if (!result.success) {
      errorMessage.textContent = result.message;
      submitButton.disabled = false;
      submitButton.textContent = "ENTER";
      return;
    }

    // Swap the form for the confirmation. The message is the same for an unknown
    // address, so this screen cannot be used to check who is registered.
    document.getElementById("sentEmail").textContent = email;
    form.classList.add("hidden");
    document.getElementById("loginHint").classList.add("hidden");
    document.getElementById("sentPanel").classList.remove("hidden");
  });
}
