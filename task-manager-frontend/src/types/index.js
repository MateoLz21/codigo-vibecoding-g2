export const TaskStatus = {
  PENDING: 'pendiente',
  COMPLETED: 'cerrado',
};

export const Task = {
  id: '',
  title: '',
  description: '',
  estado: 'pendiente',
  createdAt: '',
};

export const TaskShape = {
  id: 'uuid',
  title: 'string',
  description: 'string',
  estado: "'pendiente' | 'cerrado'",
  createdAt: 'date',
};