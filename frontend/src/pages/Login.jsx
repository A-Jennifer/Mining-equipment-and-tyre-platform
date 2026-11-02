import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck, HardHat, Wrench, ArrowRight, Eye, EyeOff, Lock, Mail,
  Zap, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import miningBg from "../assets/mining-bg.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoFormat, setDemoFormat] = useState("realistic"); // "realistic" | "legacy"
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const REALISTIC_DEMOS = [
    {
      role: "admin",
      label: "Administrator",
      name: "Meera Iyer",
      email: "admin@minetrack.demo",
      pass: "Mine@1234",
      icon: ShieldCheck,
      badge: "Full System Access",
      color: "#edae12"
    },
    {
      role: "site_manager",
      label: "Site Manager",
      name: "K. Senthil Nathan",
      email: "manager.neyveli@minetrack.demo",
      pass: "Mine@1234",
      icon: HardHat,
      badge: "Neyveli OCP",
      color: "#3b82f6"
    },
    {
      role: "technician",
      label: "Technician",
      name: "R. Karthik",
      email: "tech.neyveli1@minetrack.demo",
      pass: "Mine@1234",
      icon: Wrench,
      badge: "Work Orders & QR",
      color: "#10b981"
    }
  ];

  const LEGACY_DEMOS = [
    {
      role: "admin",
      label: "Administrator (Demo)",
      name: "System Admin",
      email: "admin@example.com",
      pass: "password123",
      icon: ShieldCheck,
      badge: "Full Admin",
      color: "#edae12"
    },
    {
      role: "site_manager",
      label: "Site Manager (Demo)",
      name: "Site Manager",
      email: "manager@example.com",
      pass: "password123",
      icon: HardHat,
      badge: "Neyveli OCP",
      color: "#3b82f6"
    },
    {
      role: "technician",
      label: "Technician (Demo)",
      name: "Technician",
      email: "tech@example.com",
      pass: "password123",
      icon: Wrench,
      badge: "3 Sample Jobs",
      color: "#10b981"
    }
  ];

  const currentDemos = demoFormat === "realistic" ? REALISTIC_DEMOS : LEGACY_DEMOS;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not sign in. Please check your credentials or click 'Sign Up' below."
      );
      setBusy(false);
    }
  };

  const handleQuickLogin = async (demoUser) => {
    setEmail(demoUser.email);
    setPassword(demoUser.pass);
    setError("");
    setBusy(true);
    try {
      await login(demoUser.email, demoUser.pass);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Demo login failed.");
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Background Graphic Decor */}
      <div className="auth-bg-overlay" style={{ backgroundImage: `url(${miningBg})` }} />
      <div className="auth-bg-gradient" />

      <div className="auth-container">
        {/* Left Hero Card */}
        <div className="auth-hero-card">
          <div className="auth-brand-badge">
            <span className="auth-brand-icon">▲</span>
            <span className="auth-brand-text">MINETRACK</span>
          </div>

          <div className="auth-hero-body">
            <div className="auth-pill-live">
              <span className="live-pulse" /> Heavy Mining Operations Telemetry
            </div>
            <h1 className="auth-hero-title">
              Mining Equipment &amp; Tyre Fleet Platform
            </h1>
            <p className="auth-hero-desc">
              Next-generation fleet intelligence tracking haul trucks, wheel loaders, and excavators across India&apos;s coal mining basins. Proactive tread wear monitoring, digital work orders, and sensor telemetry.
            </p>

            <div className="auth-hero-features">
              <div className="auth-feature-item">
                <CheckCircle2 size={16} className="feature-check" />
                <span><strong>Role-Scoped Access:</strong> Admin, Site Manager, and Field Technician views</span>
              </div>
              <div className="auth-feature-item">
                <CheckCircle2 size={16} className="feature-check" />
                <span><strong>1-Click Demo Logins:</strong> Test any role instantly without typing passwords</span>
              </div>
              <div className="auth-feature-item">
                <CheckCircle2 size={16} className="feature-check" />
                <span><strong>Open Sign-Up:</strong> Register with any reviewer email and jump straight in</span>
              </div>
            </div>
          </div>

          <div className="auth-hero-footer">
            <div className="auth-stat-chip">
              <span className="stat-num">3</span>
              <span className="stat-lbl">Mine Sites</span>
            </div>
            <div className="auth-stat-chip">
              <span className="stat-num">48+</span>
              <span className="stat-lbl">OTR Tyres</span>
            </div>
            <div className="auth-stat-chip">
              <span className="stat-num">100%</span>
              <span className="stat-lbl">Live Status</span>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">
              Sign in with your email or use a 1-click demo account below.
            </p>
          </div>

          {/* One-Click Quick Demo Login Section */}
          <div className="demo-section">
            <div className="demo-section-header">
              <div className="demo-header-left">
                <Zap size={14} className="zap-icon" />
                <span className="demo-header-label">ONE-CLICK DEMO LOGIN</span>
              </div>
              {/* Toggle Format */}
              <div className="demo-toggle-pill">
                <button
                  type="button"
                  className={`toggle-opt ${demoFormat === "realistic" ? "active" : ""}`}
                  onClick={() => setDemoFormat("realistic")}
                >
                  Realistic
                </button>
                <button
                  type="button"
                  className={`toggle-opt ${demoFormat === "legacy" ? "active" : ""}`}
                  onClick={() => setDemoFormat("legacy")}
                >
                  Legacy
                </button>
              </div>
            </div>

            <div className="demo-grid">
              {currentDemos.map((demo) => {
                const IconComponent = demo.icon;
                return (
                  <button
                    key={demo.role}
                    type="button"
                    disabled={busy}
                    className="demo-card-btn"
                    onClick={() => handleQuickLogin(demo)}
                    title={`Click to log in immediately as ${demo.label}`}
                  >
                    <div className="demo-card-top">
                      <div className="demo-icon-wrap" style={{ color: demo.color }}>
                        <IconComponent size={16} />
                      </div>
                      <span className="demo-role-badge">{demo.badge}</span>
                    </div>
                    <div className="demo-name">{demo.label}</div>
                    <div className="demo-sub">{demo.name}</div>
                    <div className="demo-click-hint">
                      <Sparkles size={11} /> 1-Click Login
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="auth-divider">
            <span>or enter email credentials</span>
          </div>

          {error && (
            <div className="auth-error-box">
              <AlertCircle size={16} className="error-icon" />
              <div className="error-content">
                <p>{error}</p>
                {error.includes("No account found") && (
                  <Link
                    to={`/register?email=${encodeURIComponent(email)}`}
                    className="error-link-btn"
                  >
                    Sign up with this email →
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-body">
            <div className="input-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@minetrack.demo or your email"
                  required
                  autoComplete="username"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="input-group">
              <div className="label-row">
                <label htmlFor="login-password">Password</label>
              </div>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="auth-input"
                />
                <button
                  type="button"
                  className="pw-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy} className="auth-submit-btn">
              {busy ? (
                <span>Signing in…</span>
              ) : (
                <>
                  <span>Sign In to Platform</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Registration Promotion Card */}
          <div className="auth-signup-banner">
            <div className="signup-banner-text">
              <strong>Need to log in with a new email?</strong>
              <p>Reviewers can create an instant account in 10 seconds.</p>
            </div>
            <Link to="/register" className="signup-banner-btn">
              Create Account
            </Link>
          </div>

          {/* Collapsible Credentials Cheat Sheet */}
          <div className="cheat-sheet-wrapper">
            <button
              type="button"
              className="cheat-sheet-toggle"
              onClick={() => setShowCheatSheet(!showCheatSheet)}
            >
              <span>View All Demo Passwords &amp; Logins</span>
              {showCheatSheet ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showCheatSheet && (
              <div className="cheat-sheet-content">
                <div className="cheat-sheet-group">
                  <div className="cheat-sheet-title">Realistic Demo Accounts (Password: <code>Mine@1234</code>)</div>
                  <ul>
                    <li><code>admin@minetrack.demo</code> — Administrator (All Sites)</li>
                    <li><code>manager.neyveli@minetrack.demo</code> — Site Manager (Neyveli OCP, Tamil Nadu)</li>
                    <li><code>tech.neyveli1@minetrack.demo</code> — Technician (Neyveli OCP, Tamil Nadu)</li>
                  </ul>
                </div>
                <div className="cheat-sheet-group">
                  <div className="cheat-sheet-title">Legacy Demo Accounts (Password: <code>password123</code>)</div>
                  <ul>
                    <li><code>admin@example.com</code> — Administrator</li>
                    <li><code>manager@example.com</code> — Site Manager (Neyveli OCP)</li>
                    <li><code>tech@example.com</code> — Technician (Neyveli OCP, 3 tasks)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}