// Usuarios temporales para probar el login.
// Mas adelante esto se reemplaza por una consulta a la base de datos.
const users = [
  {
    email: "admin@pharmalink.com",
    password: "123456",
    name: "Administrador",
    role: "ADMIN",
    enabled: true
  },
  {
    email: "usuario@pharmalink.com",
    password: "123456",
    name: "Usuario de prueba",
    role: "USUARIO",
    enabled: true
  },
  {
    email: "bloqueado@pharmalink.com",
    password: "123456",
    name: "Usuario bloqueado",
    role: "USUARIO",
    enabled: false
  }
];

export function login(email, password) {
  const user = users.find((item) => item.email === email.trim().toLowerCase());

  if (!user || user.password !== password) {
    return {
      success: false,
      message: "Email o contrasena incorrectos."
    };
  }

  if (!user.enabled) {
    return {
      success: false,
      message: "Cuenta deshabilitada. Contacte a soporte."
    };
  }

  return {
    success: true,
    user: {
      email: user.email,
      name: user.name,
      role: user.role
    }
  };
}

export function registerUser(data) {
  const emailAlreadyExists = users.some(
    (user) => user.email === data.email.trim().toLowerCase()
  );

  if (emailAlreadyExists) {
    return {
      success: false,
      message: "Este email ya esta registrado."
    };
  }

  const newUser = {
    email: data.email.trim().toLowerCase(),
    password: data.password,
    name: data.fullname.trim(),
    role: "USUARIO",
    enabled: true
  };

  users.push(newUser);

  return {
    success: true,
    user: {
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    }
  };
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
