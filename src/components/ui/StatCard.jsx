const ICON_TONES = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
};

function StatCard({ icon: Icon, label, value, hint, tone = "primary" }) {
  return (
    <div className="surface flex items-center gap-4 rounded-box p-4 sm:p-5">
      <span
        className={`hidden size-11 shrink-0 place-items-center rounded-xl sm:grid ${ICON_TONES[tone]}`}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium tracking-wide text-base-content/50 uppercase">
          {label}
        </p>
        <p className="text-xl font-bold leading-tight sm:text-2xl">{value}</p>
        {hint && <p className="truncate text-xs text-base-content/50">{hint}</p>}
      </div>
    </div>
  );
}

export default StatCard;
