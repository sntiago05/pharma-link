const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload;
}

export async function login(email, password) {
  try {
    const payload = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    return {
      success: true,
      user: payload.user || payload.data?.user,
      token: payload.token || payload.data?.token
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Email o contrasena incorrectos."
    };
  }
}

export async function registerUser(data) {
  try {
    const payload = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: data.fullname,
        email: data.email,
        password: data.password
      })
    });

    return {
      success: true,
      user: payload.user || payload.data?.user,
      token: payload.token || payload.data?.token
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "No se pudo crear la cuenta."
    };
  }
}

export function saveSession(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

export function getSession() {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}

export function logout() {
  localStorage.removeItem("currentUser");
}
