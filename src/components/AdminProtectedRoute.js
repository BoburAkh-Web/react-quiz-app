import { Navigate } from "react-router-dom";

function AdminProtectedRoute({ children }) {
  const isAdmin = sessionStorage.getItem("isAdmin") === "true";

  if (!isAdmin) return <Navigate to="/admin-login" replace />;

  return children;
}

export default AdminProtectedRoute;
