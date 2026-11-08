import { Check } from "lucide-react";
import { PASSWORD_RULES } from "../../lib/password";

const LEVEL_COLORS = ["bg-white/10", "bg-error", "bg-warning", "bg-success"];

function PasswordStrength({ password }) {
  const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).length;

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-3 gap-1.5">
        {PASSWORD_RULES.map((rule, i) => (
          <span
            key={rule.label}
            className={`h-1.5 rounded-full transition-colors ${i < passed ? LEVEL_COLORS[passed] : LEVEL_COLORS[0]}`}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {PASSWORD_RULES.map((rule) => {
          const isOk = rule.test(password);
          return (
            <li
              key={rule.label}
              className={`flex items-center gap-1.5 transition-colors ${
                isOk ? "text-success" : "text-base-content/50"
              }`}
            >
              <span className="grid size-4 place-items-center rounded-full border border-current">
                {isOk && <Check className="size-2.5" strokeWidth={4} />}
              </span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default PasswordStrength;
