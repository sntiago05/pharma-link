import { hashPassword, comparePasswords } from "../utils/passwordUtils.js";

const users = [];

export async function registerUser(req, res) {
  try {
    const { email, password, name, role = "USUARIO" } = req.body ?? {};

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password and name are required."
      });
    }

    const existingUser = users.find((user) => user.email === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered."
      });
    }

    const hashedPassword = await hashPassword(password);
    const user = {
      id: Date.now().toString(),
      email: email.toLowerCase(),
      name,
      role,
      password: hashedPassword
    };

    users.push(user);

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating user.",
      error: error.message
    });
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const userFromDB = users.find((user) => user.email === email.toLowerCase());
    if (!userFromDB) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials."
      });
    }

    const isValid = await comparePasswords(password, userFromDB.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials."
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: userFromDB.id,
        email: userFromDB.email,
        name: userFromDB.name,
        role: userFromDB.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error during login.",
      error: error.message
    });
  }
}