import { Component } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { I18nProvider } from "./lib/i18n";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Workspace from "./pages/Workspace";

// If any screen ever throws while rendering, show a friendly message instead of a blank page.
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("UI error:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="boot-screen">
        <div className="panel pad crash-box">
          <h2 className="display">Something went wrong</h2>
          <p className="muted-small">{String(this.state.error.message || this.state.error)}</p>
          <button className="btn v-default s-default" onClick={() => window.location.reload()}>Reload the page</button>
        </div>
      </div>
    );
  }
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="boot-screen">Loading…</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/" element={user ? <ErrorBoundary><Workspace /></ErrorBoundary> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <I18nProvider>
            <AppRoutes />
          </I18nProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}