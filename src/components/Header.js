import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Header() {
  const { currentStudent, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="app-header">
      <img src="js-two.png" alt="Javascript logo" />
      <h1>The Happy Quiz</h1>

      {currentStudent && (
        <div className="header-user">
          <span className="header-nickname">👤 {currentStudent.nickname}</span>
          <button className="btn header-logout" onClick={handleLogout}>
            Chiqish
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
