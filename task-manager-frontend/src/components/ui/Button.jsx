export default function Button({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}) {
  const baseClasses = 'px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-primary hover:bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-surface hover:bg-slate-700 text-text-primary border border-border',
    danger: 'bg-danger hover:bg-red-600 text-white',
    ghost: 'bg-transparent hover:bg-slate-800 text-text-secondary hover:text-text-primary',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}