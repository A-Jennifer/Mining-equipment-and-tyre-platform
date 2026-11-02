import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Wrench, HardHat, Mail, Lock, User, Building2,
  ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Sparkles, Info
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import miningBg from "../assets/mining-bg.jpg";

const FALLBACK_SITES = [
  { _id: "6ad86c2ddb6b34a0605eb353", name: "Neyveli OCP", location: "Cuddalore, Tamil Nadu" },
  { _id: "6ad86c2ddb6b34a0605eb355", name: "Kothagudem OCP", location: "Bhadradri Kothagudem, Telangana" },
  { _id: "6ad86c2ddb6b34a0605eb357", name: "Donimalai OCP", location: "Ballari, Karnataka" }
];

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [form, setForm] = useState({
    name: "",
    email: initialEmail,
    password: "",
    role: "technician",
    site: ""
  });
  const [sites, setSites] = useState(FALLBACK_SITES);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch live sites from public endpoint
    api
      .get("/auth/sites")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setSites(res.data);
          setForm((prev) => ({ ...prev, site: prev.site || res.data[0]._id }));
        }
      })
      .catch((err) => {
        console.warn("Could not fetch sites from API, using defaults:", err.message);
        if (FALLBACK_SITES.length > 0) {
          setForm((prev) => ({ ...prev, site: prev.site || FALLBACK_SITES[0]._id }));
        }
      });
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setBusy(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        site: form.site || (sites[0] && sites[0]._id)
      });
      // User is immediately logged in by register()
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Registration failed. An account with this email might already exist."
      );
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Background Graphic Decor */}
      <div className="auth-bg-overlay" style={{ backgroundImage: `url(${miningBg})` }} />
      <div className="auth-bg-gradient" />

      <div className="auth-container register-mode">
        {/* Left Hero Card */}
        <div className="auth-hero-card">
          <div className="auth-brand-badge">
            <span className="auth-brand-icon">▲</span>
            <span className="auth-brand-text">MINETRACK</span>
          </div>

          <div className="auth-hero-body">
            <div className="auth-pill-live">
              <Sparkles size={13} /> Instant Reviewer &amp; Staff Access
            </div>
            <h1 className="auth-hero-title">
              Sign Up With Your Own Email
            </h1>
            <p className="auth-hero-desc">
              Get immediate, unobstructed access to the full Mining Tyre &amp; Equipment Maintenance Platform. Pick your role to see role-specific dashboards, telemetry, and live work orders.
            </p>

            <div className="auth-hero-features">
              <div className="auth-feature-item">
                <CheckCircle2 size={16} className="feature-check" />
                <span><strong>Instant Verification:</strong> No admin approval delay — you are signed in on creation</span>
              </div>
              <div className="auth-feature-item">
                <CheckCircle2 size={16} className="feature-check" />
                <span><strong>Pre-Seeded Site Data:</strong> Includes live Caterpillar &amp; Komatsu haulers and OTR tyres</span>
              </div>
              <div className="auth-feature-item">
                <CheckCircle2 size={16} className="feature-check" />
                <span><strong>Starter Tasks:</strong> Technicians automatically receive live inspection work orders</span>
              </div>
            </div>
          </div>

          <div className="auth-hero-footer">
            <div className="auth-stat-chip">
              <span className="stat-num">Fast</span>
              <span className="stat-lbl">10-Sec Setup</span>
            </div>
            <div className="auth-stat-chip">
              <span className="stat-num">Live</span>
              <span className="stat-lbl">Real Telemetry</span>
            </div>
            <div className="auth-stat-chip">
              <span className="stat-num">2</span>
              <span className="stat-lbl">Open Roles</span>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">Create an Account</h2>
            <p className="auth-subtitle">
              Sign up with any email address to review or operate the platform.
            </p>
          </div>

          {error && (
            <div className="auth-error-box">
              <AlertCircle size={16} className="error-icon" />
              <div className="error-content">
                <p>{error}</p>
                {error.includes("already exists") && (
                  <Link to="/login" className="error-link-btn">
                    Sign in to your existing account →
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-body">
            <div className="input-group">
              <label htmlFor="reg-name">Full Name</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon" />
                <input
                  id="reg-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Dr. Sarah Jenkins"
                  required
                  className="auth-input"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="reg-email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="reviewer@domain.com or your email"
                  required
                  autoComplete="email"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="reg-password">Password (at least 6 characters)</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={6}
                  autoComplete="new-password"
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

            {/* Role Selection Cards */}
            <div className="input-group">
              <label>Select Your Operational Role</label>
              <div className="role-selector-grid">
                <div
                  className={`role-select-card ${form.role === "technician" ? "selected" : ""}`}
                  onClick={() => handleChange("role", "technician")}
                >
                  <div className="role-card-top">
                    <div className="role-icon-box tech">
                      <Wrench size={16} />
                    </div>
                    <span className="role-tag-pill">Field Operations</span>
                  </div>
                  <div className="role-card-name">Technician</div>
                  <div className="role-card-desc">
                    Field inspection jobs, QR code asset lookups, live tyre pressure telemetry &amp; replacement requests.
                  </div>
                </div>

                <div
                  className={`role-select-card ${form.role === "site_manager" ? "selected" : ""}`}
                  onClick={() => handleChange("role", "site_manager")}
                >
                  <div className="role-card-top">
                    <div className="role-icon-box manager">
                      <HardHat size={16} />
                    </div>
                    <span className="role-tag-pill">Site Oversight</span>
                  </div>
                  <div className="role-card-name">Site Manager</div>
                  <div className="role-card-desc">
                    Mine fleet overview, machinery health, maintenance job scheduling &amp; technician approval workflows.
                  </div>
                </div>
              </div>

              <div className="admin-lock-note">
                <Info size={13} className="info-icon" />
                <span>
                  <strong>Admin Role:</strong> System administrator access cannot be self-registered for security. Use the <strong>1-Click Admin Demo</strong> on the Sign In page to explore admin privileges.
                </span>
              </div>
            </div>

            {/* Site Selection */}
            <div className="input-group">
              <label htmlFor="reg-site">Assigned Mine Site</label>
              <div className="input-wrapper">
                <Building2 size={16} className="input-icon" />
                <select
                  id="reg-site"
                  value={form.site}
                  onChange={(e) => handleChange("site", e.target.value)}
                  className="auth-select"
                >
                  {sites.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.location})
                    </option>
                  ))}
                </select>
              </div>
              <p className="input-help-text">
                Your machinery, tyres, and tasks will be connected to this coal mining site.
              </p>
            </div>

            <button type="submit" disabled={busy} className="auth-submit-btn">
              {busy ? (
                <span>Setting up account…</span>
              ) : (
                <>
                  <span>Create Account &amp; Open Workspace</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-nav">
            <span>Already have an account or want to use a demo?</span>
            <Link to="/login" className="auth-alt-link">
              Sign in to your account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
