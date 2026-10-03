import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_PASSWORD = "bobur1558";

function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();

    if (password !== ADMIN_PASSWORD) {
      setError("Parol noto'g'ri!");
      return;
    }

    sessionStorage.setItem("isAdmin", "true");
    navigate("/admin");
  }

  return (
    <div className="admin-login-page">
      <h2>⚙️ Admin Panel</h2>

      <form onSubmit={handleSubmit}>
        <div className="row">
          <label htmlFor="admin-password">Admin paroli</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={!password}>
          Kirish
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
