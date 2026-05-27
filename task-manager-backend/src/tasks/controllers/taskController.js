import * as taskService from '../services/taskService.js';

export const getAllTasks = async (req, res) => {
  try {
    const tasks = await taskService.getAllTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las tareas' });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la tarea' });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, estado } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'El título es requerido' });
    }

    if (estado && !['pendiente', 'cerrado'].includes(estado)) {
      return res.status(400).json({ error: 'El estado debe ser pendiente o cerrado' });
    }

    const newTask = await taskService.createTask({ title, description, estado });
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la tarea' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, description, estado } = req.body;

    if (estado && !['pendiente', 'cerrado'].includes(estado)) {
      return res.status(400).json({ error: 'El estado debe ser pendiente o cerrado' });
    }

    const updatedTask = await taskService.updateTask(req.params.id, { title, description, estado });

    if (!updatedTask) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la tarea' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const deleted = await taskService.deleteTask(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
};