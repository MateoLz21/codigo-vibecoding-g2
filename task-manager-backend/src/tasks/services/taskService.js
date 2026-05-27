import prisma from '../../prisma.js';

export const getAllTasks = () => {
  return prisma.task.findMany();
};

export const getTaskById = (id) => {
  return prisma.task.findUnique({ where: { id } });
};

export const createTask = (taskData) => {
  return prisma.task.create({
    data: {
      title: taskData.title,
      description: taskData.description || '',
      estado: taskData.estado || 'pendiente',
    },
  });
};

export const updateTask = (id, taskData) => {
  return prisma.task.update({
    where: { id },
    data: taskData,
  });
};

export const deleteTask = (id) => {
  return prisma.task.delete({ where: { id } });
};