import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthBackground from "../components/AuthBackground";
import PasswordInput from "../components/PasswordInput";
import {
  ShieldIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  AlertIcon,
} from "../components/AuthIcons";

const ADMIN_PASSWORD = "bobur1558";

function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();

    if (password !== ADMIN_PASSWORD) {
      setError("Parol noto'g'ri!");
      setIsShaking(true);
      return;
    }

    sessionStorage.setItem("isAdmin", "true");
    navigate("/admin");
  }

  return (
    <div className="auth-page auth-page--admin">
      <AuthBackground />

      <div className="auth-card">
        <div className="auth-badge">
          <ShieldIcon />
        </div>

        <div className="auth-pill-row">
          <span className="auth-pill">
            <span className="auth-pill-dot" />
            Himoyalangan hudud
          </span>
        </div>

        <h2 className="auth-title">Admin Panel</h2>
        <p className="auth-subtitle">
          Savollar va natijalarni boshqarish uchun admin parolini kiriting
        </p>

        <form
          className={`auth-form ${isShaking ? "auth-shake" : ""}`}
          onSubmit={handleSubmit}
          onAnimationEnd={() => setIsShaking(false)}
        >
          <div className="auth-field">
            <label className="auth-label" htmlFor="admin-password">
              Admin paroli
            </label>
            <PasswordInput
              id="admin-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              autoFocus
            />
          </div>

          {error && (
            <p className="auth-error" role="alert">
              <AlertIcon />
              {error}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={!password}>
            Kirish
            <ArrowRightIcon />
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/" className="auth-link auth-link--back">
            <ArrowLeftIcon />
            O'quvchilar sahifasiga qaytish
          </Link>
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;
