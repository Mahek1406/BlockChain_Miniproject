import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ adminOnly = false }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (adminOnly && session.user.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
