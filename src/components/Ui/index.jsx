export function Button({ children, onClick, className, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 bg-blue-500 text-white rounded ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }) {
  return <div className={`bg-white shadow-md rounded-lg p-4 ${className}`}>{children}</div>;
}

export function CardContent({ children }) {
  return <div className="p-2">{children}</div>;
}

export function Spinner({ className }) {
  return <div className={`animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-white ${className}`} />;
}