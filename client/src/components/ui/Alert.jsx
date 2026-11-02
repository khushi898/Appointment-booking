const VARIANTS = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

// Coloured message box. role="alert" makes screen readers announce errors.
export default function Alert({ variant = 'error', className = '', children }) {
  if (!children) return null;
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-md border px-4 py-3 text-sm ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
