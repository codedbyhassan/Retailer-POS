const variants = {
  primary:
    'bg-brand-600 text-white shadow-ios hover:bg-brand-500 active:bg-brand-700 dark:shadow-none',
  secondary:
    'bg-black/[0.04] text-gray-700 hover:bg-black/[0.07] active:bg-black/[0.1] dark:bg-white/[0.08] dark:text-gray-200 dark:hover:bg-white/[0.12]',
  danger:
    'bg-red-500 text-white shadow-ios hover:bg-red-600 active:bg-red-700 dark:shadow-none',
  ghost:
    'bg-transparent text-gray-600 hover:bg-black/[0.04] active:bg-black/[0.07] dark:text-gray-300 dark:hover:bg-white/[0.06]',
};

const sizes = {
  sm: 'px-3.5 py-2 text-xs rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-2xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-ios active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
