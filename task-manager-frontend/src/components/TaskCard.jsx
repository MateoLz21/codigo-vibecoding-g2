import { Link } from 'react-router-dom';
import { TaskStatus } from '../types';

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCompleted = task.estado === TaskStatus.COMPLETED;

  return (
    <div className="group bg-surface rounded-xl border border-border p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link to={`/task/${task.id}`}>
            <h3 className={`font-semibold text-lg truncate transition-colors ${
              isCompleted ? 'text-text-secondary line-through' : 'text-text-primary hover:text-primary'
            }`}>
              {task.title}
            </h3>
          </Link>
          
          <p className={`mt-1 text-sm line-clamp-2 ${isCompleted ? 'text-text-secondary/60' : 'text-text-secondary'}`}>
            {task.description}
          </p>
          
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-text-secondary/60">
              {formatDate(task.createdAt)}
            </span>
            
            <div className="flex items-center gap-2">
              <select
                value={task.estado}
                onChange={(e) => onStatusChange(task, e.target.value)}
                className={`text-xs px-2 py-1 rounded-full border cursor-pointer transition-colors ${
                  isCompleted 
                    ? 'bg-success/20 text-success border-success/30' 
                    : 'bg-primary/20 text-primary border-primary/30'
                }`}
              >
                <option value={TaskStatus.PENDING}>Pendiente</option>
                <option value={TaskStatus.COMPLETED}>Cerrado</option>
              </select>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(task)}
                  className="p-2 rounded-lg hover:bg-slate-700 text-text-secondary hover:text-primary transition-colors"
                  title="Editar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-2 rounded-lg hover:bg-danger/20 text-text-secondary hover:text-danger transition-colors"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}