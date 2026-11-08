import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { BookOpen, ChartColumn, LogOut, Menu } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import Logo from "../ui/Logo";

const NAV_ITEMS = [
  { to: "/admin/tests", label: "Testlar", icon: BookOpen },
  { to: "/admin/results", label: "Natijalar", icon: ChartColumn },
];

function AdminLayout() {
  const { logout } = useAdminAuth();
  // Telefonda menyu ochiq/yopiq; kompyuterda (lg) doim ochiq turadi
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="admin-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isMenuOpen}
        onChange={(event) => setIsMenuOpen(event.target.checked)}
      />

      <div className="drawer-content flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-white/5 bg-base-300/80 px-2 backdrop-blur-md lg:hidden">
          <label htmlFor="admin-drawer" className="btn btn-square btn-ghost" aria-label="Menyuni ochish">
            <Menu className="size-5" />
          </label>
          <Logo />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-10 sm:px-6 lg:px-10 lg:pt-10">
          <Outlet />
        </main>
      </div>

      <div className="drawer-side z-40">
        <label htmlFor="admin-drawer" aria-label="Menyuni yopish" className="drawer-overlay" />
        <aside className="flex min-h-full w-72 flex-col border-r border-white/5 bg-base-200 p-4">
          <div className="flex items-center justify-between px-2 py-2">
            <Logo />
          </div>
          <span className="mx-2 mt-1 badge badge-soft badge-accent">Admin panel</span>

          <ul className="menu mt-6 w-full gap-1 p-0">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) => (isActive ? "menu-active" : "")}
                >
                  <Icon className="size-5" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          <button type="button" className="btn mt-auto justify-start btn-ghost" onClick={logout}>
            <LogOut className="size-5" />
            Chiqish
          </button>
        </aside>
      </div>
    </div>
  );
}

export default AdminLayout;
