import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { currentStudent } = useAuth();

  if (!currentStudent) return <Navigate to="/" replace />;

  return children;
}

export default ProtectedRoute;
