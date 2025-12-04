export const Button = ({ children, variant = 'primary', onClick, className = "", disabled = false, type = "button" }) => {
  const baseStyle = "px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variantes = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 border border-indigo-500/50",
    secondary: "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-indigo-600",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variantes[variant]} ${className}`}
    >
      {children}
    </button>
  );
}