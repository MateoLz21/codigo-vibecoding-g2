import * as userService from '../services/userService.js';

export const register = async (req, res) => {
  try {
    const { name, lastname, email, password } = req.body;

    if (!name || !lastname || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const user = await userService.register({ name, lastname, email, password });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.message === 'El email ya está registrado') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const { user, token } = await userService.login(email, password);

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.message === 'Credenciales inválidas') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const getMe = async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const user = await userService.getUserByToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    res.json({
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(400).json({ error: 'Token no proporcionado' });
    }

    await userService.logout(token);

    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};