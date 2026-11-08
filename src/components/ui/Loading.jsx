function Loading({ label = "Yuklanmoqda...", fullPage = false }) {
  return (
    <div role="status" className={`grid place-items-center ${fullPage ? "min-h-dvh" : "py-16"}`}>
      <div className="flex flex-col items-center gap-3 text-base-content/60">
        <span className="loading loading-spinner loading-lg text-primary" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}

export default Loading;
