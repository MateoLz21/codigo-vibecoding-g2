import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService } from '../services/api';
import { TaskStatus } from '../types';
import Button from '../components/ui/Button';
import Layout from '../layout/Layout';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.getById(id);
      setTask(response.data);
    } catch (err) {
      setError('Error al cargar la tarea. La tarea no existe o el backend no está ejecutándose.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!task) return;
    try {
      setSaving(true);
      const updated = await taskService.update(id, {
        ...task,
        estado: newStatus,
      });
      setTask(updated.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;
    try {
      await taskService.delete(id);
      navigate('/');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCompleted = task?.estado === TaskStatus.COMPLETED;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-slate-700 rounded w-1/3 mb-8" />
            <div className="bg-surface rounded-2xl border border-border p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-slate-700" />
                <div className="h-6 bg-slate-700 rounded w-32" />
              </div>
              <div className="h-8 bg-slate-700 rounded w-3/4 mb-4" />
              <div className="h-4 bg-slate-700 rounded w-full mb-2" />
              <div className="h-4 bg-slate-700 rounded w-full mb-2" />
              <div className="h-4 bg-slate-700 rounded w-2/3" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !task) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Tarea no encontrada
            </h3>
            <p className="text-text-secondary mb-6">{error || 'La tarea no existe'}</p>
            <Button onClick={() => navigate('/')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al inicio
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a las tareas
        </button>

        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="p-8 border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className={`text-2xl font-bold ${
                  isCompleted ? 'text-text-secondary line-through' : 'text-text-primary'
                }`}>
                  {task.title}
                </h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <select
                    value={task.estado}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={saving}
                    className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                      isCompleted 
                        ? 'bg-success/20 text-success border border-success/30' 
                        : 'bg-primary/20 text-primary border border-primary/30'
                    }`}
                  >
                    <option value={TaskStatus.PENDING}>Pendiente</option>
                    <option value={TaskStatus.COMPLETED}>Cerrado</option>
                  </select>
                  <span className="text-sm text-text-secondary">
                    Creada el {formatDate(task.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">
              Descripción
            </h2>
            <p className={`text-lg leading-relaxed ${
              isCompleted ? 'text-text-secondary' : 'text-text-primary'
            }`}>
              {task.description || 'Sin descripción'}
            </p>
          </div>

          <div className="p-8 border-t border-border bg-slate-900/50 flex items-center justify-between">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 text-danger hover:text-red-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar tarea
            </button>
            
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => navigate('/')}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}