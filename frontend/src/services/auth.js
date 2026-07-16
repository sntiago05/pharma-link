import { apiFetch, ApiError } from "./api.js";
import { clearSession, getSession, getToken, saveContext, saveSession } from "./session.js";

/**
 * Authentication actions.
 *
 * `login` / `registerUser` keep returning `{ success, message, user, token }`
 * rather than throwing, because the views render `result.message` inline.
 */

/** Authenticates and stores the session (user *and* token). */
export async function login(email, password) {
  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false
    });

    saveSession({ user: data.user, token: data.token });
    return { success: true, user: data.user, token: data.token };
  } catch (error) {
    return {
      success: false,
      message: error instanceof ApiError ? error.detail : "Email o contraseña incorrectos."
    };
  }
}

/** Registers a patient account. The backend always assigns the PATIENT role. */
export async function registerUser(data) {
  try {
    const created = await apiFetch("/auth/register", {
      method: "POST",
      body: {
        fullName: data.fullname || data.fullName,
        email: data.email,
        password: data.password
      },
      auth: false
    });

    return { success: true, user: created.user };
  } catch (error) {
    return {
      success: false,
      message: error instanceof ApiError ? error.detail : "No se pudo crear la cuenta."
    };
  }
}

/**
 * Loads `GET /api/me` and caches it.
 *
 * Called right after login: the JWT says *what* the user is but not *which*
 * pharmacy, EPS or patient profile they belong to, and every scoped endpoint
 * needs that id in its path.
 */
export async function loadContext() {
  const context = await apiFetch("/me");
  saveContext(context);
  return context;
}

export function logout() {
  clearSession();
}

// Re-exported so existing imports from "../services/auth.js" keep resolving.
export { getSession, getToken, saveSession };
