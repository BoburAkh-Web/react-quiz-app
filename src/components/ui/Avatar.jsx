function Avatar({ name, size = "md" }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-brand font-bold text-white ${
        size === "sm" ? "size-8 text-sm" : "size-10"
      }`}
    >
      {name?.charAt(0).toUpperCase()}
    </span>
  );
}

export default Avatar;
