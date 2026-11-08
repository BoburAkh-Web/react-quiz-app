import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useStudentAuth } from "../../context/StudentAuthContext";
import Loading from "../ui/Loading";

export function RequireStudent() {
  const { student, isChecking } = useStudentAuth();
  const location = useLocation();

  if (isChecking) return <Loading fullPage />;
  if (!student) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { isAdmin, isChecking } = useAdminAuth();
  const location = useLocation();

  if (isChecking) return <Loading fullPage />;
  if (!isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
