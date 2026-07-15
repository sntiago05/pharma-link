import { login, saveSession } from "../services/auth.js";

function loginTemplate() {
  return `
  <main class="min-h-screen bg-slate-50 px-4 py-8 flex items-center justify-center">
    <section class="relative w-full max-w-[390px] overflow-hidden lg:max-w-[700px] lg:rounded-[32px] lg:bg-white lg:px-6 lg:py-8 lg:shadow-xl lg:ring-1 lg:ring-slate-200">
      <header class="mb-10 text-center">
        <img src="./img/logo horizontal.png" alt="Pharma Link logo" class="mx-auto h-14 w-26" />
      </header>

      <div class="mb-10 flex justify-center">
        <img
          src="./img/loginImg.png"
          alt="Illustración de salud y farmacia"
          class="h-44 w-44 rounded-full bg-slate-100 object-cover"
        />
      </div>

      <div class="mb-8 text-center">
        <h1 class="text-2xl font-semibold text-slate-900">Join Pharma <span class="text-teal-900">Link</span></h1>
        <p class="mt-2 text-sm text-slate-500">Inicia sesión para acceder a tu tablero y gestionar tu farmacia.</p>
      </div>

      <form id="loginForm" class="space-y-5" method="post" novalidate>
        <div class="space-y-2">
          <label for="email" class="block text-sm font-medium text-slate-700">Email or ID</label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            class="w-full rounded-sm border border-neutral-300 bg-transparent px-3 py-3 text-sm text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <div class="space-y-2">
          <label for="password" class="block text-sm font-medium text-slate-700">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            class="w-full rounded-sm border border-neutral-300 bg-transparent px-3 py-3 text-sm text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <button
          type="submit"
          class="w-full rounded-md bg-gradient-to-r from-emerald-800 to-emerald-600 px-4 py-3 text-base font-bold text-white shadow-lg shadow-emerald-200/50"
        >
          LOGIN
        </button>

        <p id="errorMessage" class="min-h-5 text-center text-sm font-medium text-red-600"></p>
      </form>

      <p class="mt-6 text-center text-sm text-slate-500">
        Don't have an account?
        <a href="/register" class="font-semibold text-emerald-800 hover:text-emerald-600">Sign up</a>
      </p>
    </section>
  </main>
  `;
}

export function renderLogin({ navigate }) {
  document.getElementById("app").innerHTML = loginTemplate();

  document.getElementById("signupLink").addEventListener("click", (event) => {
    event.preventDefault();
    navigate("/register");
  });

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
    if (result.user.role === "ADMIN") {
      navigate("/admin");
      return;
    }

    navigate("/profile");
  });
}
