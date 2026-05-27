import { useState, useEffect, useCallback, useMemo } from 'react';
import { taskService } from '../services/api';
import { TaskStatus } from '../types';
import TaskCard from '../components/TaskCard';
import TaskDialog from '../components/TaskDialog';
import Button from '../components/ui/Button';
import Layout from '../layout/Layout';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.getAll();
      setTasks(response.data);
    } catch (err) {
      setError('Error al cargar las tareas. Asegúrate de que el backend esté ejecutándose en localhost:3000');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter(task => task.estado === filter);
  }, [tasks, filter]);

  const taskCounts = useMemo(() => ({
    all: tasks.length,
    pendiente: tasks.filter(t => t.estado === TaskStatus.PENDING).length,
    cerrado: tasks.filter(t => t.estado === TaskStatus.COMPLETED).length,
  }), [tasks]);

  const handleOpenDialog = (task = null) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTask(null);
  };

  const handleSubmit = async (formData) => {
    try {
      setDialogLoading(true);
      if (selectedTask) {
        await taskService.update(selectedTask.id, formData);
      } else {
        await taskService.create({ ...formData, estado: TaskStatus.PENDING });
      }
      await fetchTasks();
      handleCloseDialog();
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;
    try {
      await taskService.delete(id);
      await fetchTasks();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await taskService.update(task.id, {
        ...task,
        estado: newStatus,
      });
      await fetchTasks();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const filterButtons = [
    { value: 'all', label: 'Todas', count: taskCounts.all },
    { value: TaskStatus.PENDING, label: 'Pendientes', count: taskCounts.pendiente },
    { value: TaskStatus.COMPLETED, label: 'Cerradas', count: taskCounts.cerrado },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between pt-4">
          <div>
            <h2 className="text-4xl font-bold text-text-primary">
              Mis Tareas
            </h2>
            <p className="mt-3 text-lg text-text-secondary">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'tarea' : 'tareas'}
              {filter !== 'all' && ` ${filter === TaskStatus.PENDING ? 'pendientes' : 'cerradas'}`}
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Tarea
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {filterButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === btn.value
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-slate-700 border border-border'
              }`}
            >
              {btn.label}
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/20">
                {btn.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-surface rounded-xl border border-border p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-5 h-5 rounded-full bg-slate-700" />
                  <div className="flex-1">
                    <div className="h-6 bg-slate-700 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-slate-700 rounded w-full mb-2" />
                    <div className="h-4 bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Algo salió mal
            </h3>
            <p className="text-text-secondary mb-6 max-w-md">{error}</p>
            <Button onClick={fetchTasks}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reintentar
            </Button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {filter === 'all' ? 'No hay tareas aún' : `No hay tareas ${filter === TaskStatus.PENDING ? 'pendientes' : 'cerradas'}`}
            </h3>
            <p className="text-text-secondary mb-6">
              {filter === 'all' ? 'Comienza creando tu primera tarea' : 'Prueba con otro filtro'}
            </p>
            {filter === 'all' && (
              <Button onClick={() => handleOpenDialog()}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Tarea
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleOpenDialog}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      <TaskDialog
        isOpen={dialogOpen}
        onClose={handleCloseDialog}
        task={selectedTask}
        onSubmit={handleSubmit}
        isLoading={dialogLoading}
      />
    </Layout>
  );
}