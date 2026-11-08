import { Link, Outlet } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import { useStudentAuth } from "../../context/StudentAuthContext";
import Avatar from "../ui/Avatar";
import Logo from "../ui/Logo";

function StudentLayout() {
  const { student, logout } = useStudentAuth();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-base-300/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Link to="/tests" aria-label="Testlar">
            <Logo />
          </Link>

          <div className="dropdown dropdown-end">
            <button type="button" tabIndex={0} className="btn gap-2 px-2 btn-ghost">
              <Avatar name={student.nickname} size="sm" />
              <span className="hidden max-w-40 truncate sm:inline">{student.nickname}</span>
              <ChevronDown className="size-4 opacity-60" />
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content menu surface z-10 mt-2 w-56 rounded-box p-2"
            >
              <li className="menu-title truncate">{student.nickname}</li>
              <li>
                <button type="button" onClick={logout}>
                  <LogOut className="size-4" />
                  Chiqish
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 pb-10 sm:pt-10">
        <Outlet />
      </main>
    </div>
  );
}

export default StudentLayout;
