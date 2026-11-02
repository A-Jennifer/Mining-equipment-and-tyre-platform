import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap any page that needs login. Optionally restrict to specific roles:
// <ProtectedRoute roles={["admin"]}><AdminPage /></ProtectedRoute>
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <p style={{ padding: 20 }}>You don't have permission to view this page.</p>;
  }

  return children;
}
