// Bir nechta variantdan bittasini tanlash (radio tugmalar). daisyUI tanlanganini primary rangda ko'rsatadi.
function ChoiceGroup({ name, options, value, onChange, disabled = false, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <input
          key={option.value}
          type="radio"
          name={name}
          className="btn min-w-14 btn-sm sm:btn-md"
          aria-label={option.label}
          checked={value === option.value}
          onChange={() => onChange(option.value)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

export default ChoiceGroup;
