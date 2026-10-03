import { useState } from "react";
import { LockIcon, EyeIcon, EyeOffIcon } from "./AuthIcons";

// Parol input: ko'zcha tugmasi bilan ko'rsatish/yashirish + Caps Lock ogohlantirishi
function PasswordInput({ id, value, onChange, placeholder, autoComplete, autoFocus }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);

  function handleKey(e) {
    setIsCapsLock(e.getModifierState?.("CapsLock") ?? false);
  }

  return (
    <>
      <div className="auth-input-wrap">
        <LockIcon className="auth-input-icon" />
        <input
          id={id}
          className="auth-input auth-input--password"
          type={isVisible ? "text" : "password"}
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
          className="auth-eye"
          onClick={() => setIsVisible((v) => !v)}
          // Tugma bosilganda input fokusni yo'qotmasin
          onMouseDown={(e) => e.preventDefault()}
          aria-label={isVisible ? "Parolni yashirish" : "Parolni ko'rsatish"}
          aria-pressed={isVisible}
          title={isVisible ? "Parolni yashirish" : "Parolni ko'rsatish"}
        >
          {/* key o'zgarganda ikonka qayta mount bo'lib, animatsiya ishlaydi */}
          {isVisible ? <EyeOffIcon key="off" /> : <EyeIcon key="on" />}
        </button>
      </div>

      {isCapsLock && <p className="auth-caps">⇪ Caps Lock yoqilgan</p>}
    </>
  );
}

export default PasswordInput;
