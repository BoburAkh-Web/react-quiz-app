function Field({ label, htmlFor, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-baseline justify-between gap-2 text-sm font-medium text-base-content/80"
      >
        {label}
        {hint && <span className="text-xs font-normal text-base-content/50">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

export default Field;
