import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthBackground from "../components/AuthBackground";
import PasswordInput from "../components/PasswordInput";
import {
  UserIcon,
  ArrowRightIcon,
  AlertIcon,
  CheckIcon,
} from "../components/AuthIcons";

// AuthContext'dagi isPasswordValid bilan bir xil qoidalar
const PASSWORD_RULES = [
  { label: "Kamida 8 ta belgi", test: (p) => p.length >= 8 },
  { label: "Harf", test: (p) => /[a-zA-Z]/.test(p) },
  { label: "Raqam", test: (p) => /[0-9]/.test(p) },
];

function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");

  const { login, register, currentStudent, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const isLogin = mode === "login";
  const passedRules = PASSWORD_RULES.filter((rule) => rule.test(password));

  // Login/ro'yxatdan o'tish muvaffaqiyatli bo'lgach, /quiz ga o'tish
  useEffect(() => {
    if (currentStudent) navigate("/quiz");
  }, [currentStudent, navigate]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!nickname || !password) return;

    if (isLogin) {
      login(nickname, password);
    } else {
      register(nickname, password);
    }
  }

  return (
    <div className="auth-page">
      <AuthBackground />

      <div className="auth-card">
        <div className="auth-brand">
          <img src="js-two.png" alt="" />
          <span className="auth-brand-name">The Happy Quiz</span>
        </div>

        <h2 className="auth-title">
          {isLogin ? "Xush kelibsiz! 👋" : "Hisob yarating ✨"}
        </h2>
        <p className="auth-subtitle">
          {isLogin
            ? "Bilimingizni sinash uchun hisobingizga kiring"
            : "Bir daqiqada ro'yxatdan o'ting va testni boshlang"}
        </p>

        <div className="auth-tabs" data-mode={mode} role="tablist">
          <span className="auth-tabs-indicator" />
          <button
            type="button"
            role="tab"
            aria-selected={isLogin}
            className={`auth-tab ${isLogin ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Kirish
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isLogin}
            className={`auth-tab ${!isLogin ? "active" : ""}`}
            onClick={() => setMode("register")}
          >
            Ro'yxatdan o'tish
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="nickname">
              Nickname
            </label>
            <div className="auth-input-wrap">
              <UserIcon className="auth-input-icon" />
              <input
                id="nickname"
                className="auth-input"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Masalan: bobur_dev"
                autoComplete="username"
                spellCheck="false"
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              Parol
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Parolingizni kiriting" : "Yangi parol o'ylab toping"}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {!isLogin && (
            <div className="auth-strength" data-level={passedRules.length}>
              <div className="auth-strength-bars">
                <span className="auth-strength-bar" />
                <span className="auth-strength-bar" />
                <span className="auth-strength-bar" />
              </div>
              <ul className="auth-rules">
                {PASSWORD_RULES.map((rule) => {
                  const ok = rule.test(password);
                  return (
                    <li key={rule.label} className={`auth-rule ${ok ? "ok" : ""}`}>
                      <span className="auth-rule-mark">
                        {ok && <CheckIcon />}
                      </span>
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {error && (
            <p className="auth-error" role="alert">
              <AlertIcon />
              {error}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="auth-spinner" />
                Yuklanmoqda...
              </>
            ) : (
              <>
                {isLogin ? "Kirish" : "Ro'yxatdan o'tish"}
                <ArrowRightIcon />
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          {isLogin ? "Hisobingiz yo'qmi? " : "Hisobingiz bormi? "}
          <button
            type="button"
            className="auth-link"
            onClick={() => setMode(isLogin ? "register" : "login")}
          >
            {isLogin ? "Ro'yxatdan o'ting" : "Kiring"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
