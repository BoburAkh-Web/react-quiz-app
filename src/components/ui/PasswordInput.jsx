import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

// Ko'zcha bilan ko'rsatish/yashirish va Caps Lock ogohlantirishi
function PasswordInput({ id, value, onChange, placeholder, autoComplete, autoFocus, large = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);
  const toggleLabel = isVisible ? "Parolni yashirish" : "Parolni ko'rsatish";

  function handleKey(event) {
    setIsCapsLock(event.getModifierState?.("CapsLock") ?? false);
  }

  return (
    <div>
      <label className={`input w-full ${large ? "input-lg" : ""}`}>
        <Lock className="size-5 opacity-50" />
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          className="grow"
          value={value}
          onChange={onChange}
          onKeyDown={handleKey}
          onKeyUp={handleKey}
          onBlur={() => setIsCapsLock(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          spellCheck="false"
        />
        <button
          type="button"
          className="btn btn-circle btn-ghost btn-sm -mr-2"
          onClick={() => setIsVisible((visible) => !visible)}
          // Bosilganda input fokusni yo'qotmasin
          onMouseDown={(event) => event.preventDefault()}
          aria-label={toggleLabel}
          aria-pressed={isVisible}
          title={toggleLabel}
        >
          {isVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </label>
      {isCapsLock && <p className="mt-1.5 text-xs text-warning">⇪ Caps Lock yoqilgan</p>}
    </div>
  );
}

export default PasswordInput;
