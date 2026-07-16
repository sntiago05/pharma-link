import { registerUser, saveSession } from "../services/auth.js";
import { inputField } from "./components.js";

function registerTemplate() {
  return `
    <main class="min-h-screen bg-[#F8FAFC] px-4 py-8 text-slate-900 sm:px-6 md:px-10 lg:px-16">
      <div class="mx-auto w-full max-w-md overflow-hidden rounded-[32px] bg-white p-6 shadow-xl shadow-emerald-900/10 md:max-w-xl md:p-8 lg:max-w-3xl">
      <div class="mb-8 flex flex-col items-center justify-center gap-3 text-center">
        <img class="h-14 w-14" src="/img/image%201.png" alt="PharmaLink logo" />
        <div>
          <p class="text-2xl font-semibold text-[#0D4D44]">Pharma<span class="text-[#059E3E]">Link</span></p>
        </div>
      </div>

      <div class="space-y-4">
        <h1 class="text-3xl font-semibold leading-tight text-[#0D4D44]">Create your PharmaLink account</h1>
        <p class="text-sm leading-6 text-slate-600">Fill in the form to access your pharmacy, orders, and promotions on a secure platform.</p>
      </div>

      <form id="registerForm" class="mt-8 space-y-4" aria-label="registration form">
        ${inputField({ id: "userId", label: "ID", type: "text", autocomplete: "off" })}
        ${inputField({ id: "fullname", label: "Full name", type: "text", autocomplete: "name" })}
        ${inputField({ id: "email", label: "Email", type: "email", autocomplete: "email" })}
        ${inputField({ id: "phone", label: "Phone", type: "tel", autocomplete: "tel" })}
        ${inputField({ id: "password", label: "Password", type: "password", autocomplete: "new-password" })}
        ${inputField({ id: "confirmPassword", label: "Confirm Password", type: "password", autocomplete: "new-password" })}

        <div class="flex items-start gap-3 rounded-[24px] bg-[#F1F5F9] p-4 text-[11px] text-slate-600">
          <label class="flex cursor-pointer items-center gap-3">
            <input id="terms" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[#059E3E] focus:ring-[#059E3E]" />
            <span>I accept the <span class="font-semibold text-[#059E3E]">Terms & Conditions</span> and <span class="font-semibold text-[#059E3E]">Privacy Policy</span>.</span>
          </label>
        </div>

        <p id="errorMessage" class="min-h-[1.25rem] text-sm font-medium text-red-600"></p>
        <button type="submit" class="flex h-12 w-full items-center justify-center rounded-[28px] bg-gradient-to-r from-[#0D4D44] to-[#059E3E] text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:opacity-95">Create account</button>
      </form>

      <p class="mt-4 text-center text-[11px] text-slate-500">Already have an account? <a id="loginLink" href="/login" class="font-semibold text-[#059E3E]">Sign in</a></p>
      </div>
    </main>
  `;
}

export function renderRegister({ navigate }) {
  document.getElementById("app").innerHTML = registerTemplate();

  document.getElementById("loginLink").addEventListener("click", (event) => {
    event.preventDefault();
    navigate("/login");
  });

  document.getElementById("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const termsChecked = document.getElementById("terms").checked;
    const errorMessage = document.getElementById("errorMessage");

    if (!termsChecked) {
      errorMessage.textContent = "You must accept the terms and conditions to create an account.";
      return;
    }

    if (password !== confirmPassword) {
      errorMessage.textContent = "Passwords do not match.";
      return;
    }

    const result = await registerUser({
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
    navigate("/patient/dashboard");
  });
}
