import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingWave from "./Loading";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) return <LoadingWave />;

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ?? <Outlet />;
}