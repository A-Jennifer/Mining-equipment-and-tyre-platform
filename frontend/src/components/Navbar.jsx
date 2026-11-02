import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Truck, Wrench, ScanLine, MapPin, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { TyreIllustration } from "./illustrations";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/equipment", label: "Equipment", icon: Truck },
    { to: "/tyres", label: "Tyres", icon: "tyre" },
    { to: "/maintenance", label: "Maintenance", icon: Wrench },
    { to: "/qr-lookup", label: "QR Lookup", icon: ScanLine }
  ];
  if (user.role === "admin") navItems.push({ to: "/sites", label: "Sites", icon: MapPin });

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-mark">
          <Truck size={19} color="#fff" />
        </span>
        <div>
          <div className="logo-title">MineTrack</div>
          <div className="logo-sub">Tyre & Equipment</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
            {Icon === "tyre" ? <TyreIllustration size={18} color="currentColor" /> : <Icon size={18} />}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="avatar">{initials}</span>
          <div>
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role.replace("_", " ")}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </aside>
  );
}