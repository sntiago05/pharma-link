import { login, saveSession } from "../auth.js";
import { authShell } from "./components.js";

function loginTemplate() {
  return authShell(`
    <div class="mx-auto w-full max-w-md overflow-hidden rounded-[32px] bg-white p-6 shadow-xl shadow-emerald-900/10 md:max-w-xl md:p-8 lg:max-w-3xl">
      <header class="mb-8 text-center">
        <img class="mx-auto h-14 w-14" src="https://placehold.co/50x56" alt="logo" />
        <div class="mt-4">
          <p class="text-2xl font-semibold text-[#0D4D44]">Pharma<span class="text-[#059E3E]">Link</span></p>
          <p class="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">F A R M A C I A</p>
        </div>
      </header>

      <form id="loginForm" class="space-y-4" aria-label="login form">
        <div>
          <label for="email" class="mb-2 block text-sm font-semibold text-slate-700">Email or ID</label>
          <input id="email" name="email" type="text" autocomplete="username" class="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
        </div>

        <div>
          <label for="password" class="mb-2 block text-sm font-semibold text-slate-700">Password</label>
          <input id="password" name="password" type="password" autocomplete="current-password" class="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
        </div>

        <p id="errorMessage" class="min-h-[1.25rem] text-sm font-medium text-red-600"></p>
        <button type="submit" class="w-full rounded-[28px] bg-gradient-to-r from-[#0D4D44] to-[#059E3E] py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:opacity-95">LOGIN</button>
      </form>

      <p class="mt-4 text-center text-[11px] text-slate-500">Don't have an account? <a id="signupLink" href="/register" class="font-semibold text-[#059E3E]">Sign up</a></p>
    </div>
  `);
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
