import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");

  const { login, register, currentStudent, isLoading, error } = useAuth();
  const navigate = useNavigate();

  // Login/ro'yxatdan o'tish muvaffaqiyatli bo'lgach, /quiz ga o'tish
  useEffect(() => {
    if (currentStudent) navigate("/quiz");
  }, [currentStudent, navigate]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!nickname || !password) return;

    if (mode === "login") {
      login(nickname, password);
    } else {
      register(nickname, password);
    }
  }

  return (
    <div className="login-page">
      <h2>{mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}</h2>

      <form onSubmit={handleSubmit}>
        <div className="row">
          <label htmlFor="nickname">Nickname</label>
          <input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <div className="row">
          <label htmlFor="password">Parol</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {mode === "register" && (
          <p className="hint">
            Parol kamida 8 ta belgi, harf va raqamdan iborat bo'lishi kerak
          </p>
        )}

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={isLoading}>
          {isLoading
            ? "Yuklanmoqda..."
            : mode === "login"
              ? "Kirish"
              : "Ro'yxatdan o'tish"}
        </button>
      </form>

      <button
        type="button"
        className="switch-mode"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login"
          ? "Hisobingiz yo'qmi? Ro'yxatdan o'ting"
          : "Hisobingiz bormi? Kiring"}
      </button>
    </div>
  );
}

export default Login;
