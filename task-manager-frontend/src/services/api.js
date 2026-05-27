import axios from 'axios';

const API_URL = 'http://localhost:3000/tasks';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const taskService = {
  getAll: () => api.get('/'),
  getById: (id) => api.get(`/${id}`),
  create: (task) => api.post('/', task),
  update: (id, task) => api.put(`/${id}`, task),
  delete: (id) => api.delete(`/${id}`),
};

export default taskService;