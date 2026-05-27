import prisma from '../../prisma.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const register = async (userData) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new Error('El email ya está registrado');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const user = await prisma.user.create({
    data: {
      name: userData.name,
      lastname: userData.lastname,
      email: userData.email,
      password: hashedPassword,
    },
  });

  return user;
};

export const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new Error('Credenciales inválidas');
  }

  const token = uuidv4();

  await prisma.user.update({
    where: { id: user.id },
    data: { token },
  });

  return { user, token };
};

export const getUserByToken = async (token) => {
  const user = await prisma.user.findFirst({
    where: { token },
  });

  return user;
};

export const getUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const logout = async (token) => {
  await prisma.user.updateMany({
    where: { token },
    data: { token: null },
  });
};