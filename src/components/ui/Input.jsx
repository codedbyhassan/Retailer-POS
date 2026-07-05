export default function Input({
  label,
  error,
  className = '',
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-2xl border bg-black/[0.02] px-4 py-3 text-sm font-medium transition-all duration-200 ease-ios placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-gray-500 ${
          error
            ? 'border-red-400/60 focus:ring-red-500/30'
            : 'border-black/[0.06] focus:border-brand-400 dark:border-white/[0.08]'
        }`}
        {...props}
      />
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
