import { clearSession, getToken } from "./session.js";

/**
 * HTTP client for the PharmaLink API.
 *
 * Centralises three things every call needs: the bearer token, unwrapping the
 * `{ success, message, data }` envelope, and turning a failure into an Error
 * that carries the backend's own message and field errors.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

/** Error carrying the API's status, message and field-level details. */
export class ApiError extends Error {
  constructor(message, { status, errors = [] } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  /** Joins the validation details into one readable line. */
  get detail() {
    if (!this.errors.length) return this.message;
    return this.errors.map((error) => error.message || error).join(" ");
  }
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    // Skip empty filters so `?status=` never reaches the API as a real filter.
    if (value === undefined || value === null || value === "") continue;
    search.append(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/**
 * Performs a request and returns the `data` field of the envelope.
 *
 * @param {string} path Path after `/api`, e.g. `/orders/me`.
 * @param {object} [options]
 * @param {string} [options.method="GET"]
 * @param {object} [options.body] Serialised as JSON.
 * @param {object} [options.params] Query string values; empty ones are dropped.
 * @param {boolean} [options.auth=true] Send the bearer token.
 * @returns {Promise<*>} The `data` payload.
 * @throws {ApiError}
 */
export async function apiFetch(path, { method = "GET", body, params, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();

  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}${buildQuery(params)}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    // fetch only rejects on network failure; give a message a user can act on.
    throw new ApiError("No se pudo conectar con el servidor. Verifica que el backend esté activo.", {
      status: 0
    });
  }

  // 204 (catalog deletes) has no body to parse.
  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // The token is missing, expired or belongs to a disabled account. Drop it
      // so the router sends the user to /login instead of looping on 401s.
      clearSession();
    }

    throw new ApiError(payload.message || `Error ${response.status}`, {
      status: response.status,
      errors: payload.errors || []
    });
  }

  return payload.data;
}

export const apiGet = (path, params) => apiFetch(path, { params });
export const apiPost = (path, body) => apiFetch(path, { method: "POST", body });
export const apiPut = (path, body) => apiFetch(path, { method: "PUT", body });
export const apiPatch = (path, body) => apiFetch(path, { method: "PATCH", body });
export const apiDelete = (path, body) => apiFetch(path, { method: "DELETE", body });
