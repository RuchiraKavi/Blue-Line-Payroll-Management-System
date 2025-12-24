import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import normalizeRole from "../utils/normalizeRole";
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check if user's role is in allowedRoles (use shared normalizer)
  const userRole = normalizeRole(user.role);
  const allowedNormalized = allowedRoles.map((r) => normalizeRole(r));

  if (!allowedNormalized.includes(userRole)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;
