function Logo({ size = "md" }) {
  const isLarge = size === "lg";

  return (
    <span className="inline-flex items-center gap-2.5">
      <img src="/logo.png" alt="" className={isLarge ? "size-11" : "size-8"} />
      <span className={`font-extrabold tracking-tight ${isLarge ? "text-2xl" : "text-lg"}`}>
        The <span className="text-gradient">Happy</span> Quiz
      </span>
    </span>
  );
}

export default Logo;
