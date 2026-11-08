function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="surface flex flex-col items-center gap-3 rounded-box px-6 py-14 text-center">
      {Icon && (
        <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-7" />
        </span>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-base-content/60">{description}</p>}
      {children && <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

export default EmptyState;
