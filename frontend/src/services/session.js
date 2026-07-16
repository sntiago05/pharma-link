/**
 * Session storage.
 *
 * The JWT is what every authenticated request needs, and it was previously
 * thrown away at login (`saveSession(result.user)` stored the user only), so no
 * protected endpoint could ever be reached. Token and user are now stored
 * together and cleared together.
 */

const USER_KEY = "currentUser";
const TOKEN_KEY = "authToken";
const CONTEXT_KEY = "sessionContext";

const read = (key) => {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    // A value written by an older build (or hand-edited) must not break boot.
    localStorage.removeItem(key);
    return null;
  }
};

/** Persists the login result. */
export function saveSession({ user, token }) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

/** The logged-in user, or null. Shape: `{ id, fullName, email, role }`. */
export function getSession() {
  return read(USER_KEY);
}

/** The raw JWT, or null. */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Caches `GET /api/me`: which pharmacy, EPS or patient profile the user is
 * attached to. Scoped endpoints need those ids in their paths.
 */
export function saveContext(context) {
  localStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
}

export function getContext() {
  return read(CONTEXT_KEY);
}

/** Clears everything. Used on logout and on any 401 from the API. */
export function clearSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CONTEXT_KEY);
}
