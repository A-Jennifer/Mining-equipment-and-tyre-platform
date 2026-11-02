import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, BarChart3, Bot, Building2, CircleAlert, ClipboardCheck, ClipboardList, Download, FileText,
  Gauge, Globe, HardHat, LayoutDashboard, LifeBuoy, ListChecks, LogOut, MapPin, Plus, QrCode, Radio, Search,
  ShieldCheck, Truck, Users, WifiOff, Wrench
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../lib/i18n";
import { Button, Dialog, Input } from "../components/ui";
import { Assistant, BrandInsights, QrLookup, SensorFeed } from "../components/smart-features";
import DetailBody from "../components/DetailBody";
import { AddDialog, Metric, SitesView, SpendChart } from "../components/Parts";
import { ApprovalsView, MyTasksView, TeamPanel, UsersView } from "../components/RoleViews";
import NotificationCentre from "../components/NotificationCentre";
import TyreDiagram from "../components/TyreDiagram";
import AuditLogView from "../components/AuditLogView";
import MineMap from "../components/MineMap";
import ReorderForecast from "../components/ReorderForecast";
import { exportToCsv, exportPdfReport } from "../utils/export";
import {
  adaptEquipment, adaptService, adaptTyre, adaptUser, fmtDate, healthTone, statusClass, tyreHealth
} from "../lib/fleet";
import { HOME, NAV, ROLE_HERO, ROLE_LABEL, can } from "../lib/roles";
import haulTruck from "../assets/haul-truck.jpg";
import tyrePhoto from "../assets/mining-tyre.jpg";

const ICONS = {
  Overview: LayoutDashboard, "My Tasks": ListChecks, Equipment: Truck, Tyres: CircleAlert, Maintenance: Wrench,
  Approvals: ClipboardCheck, Analytics: BarChart3, Sites: Building2, Users, "Mine Map": MapPin, "QR Lookup": QrCode,
  "Live Sensors": Radio, Assistant: Bot, "Audit Log": ClipboardList
};
const SUBTITLES = {
  Overview: "A clear picture of every machine, every tyre, and what needs attention.",
  "My Tasks": "The jobs assigned to you, and the tyres at your site that need attention.",
  Equipment: "The machines that keep your site moving.",
  Tyres: "Stay ahead of wear, replacement and unexpected downtime.",
  Maintenance: "Plan the work, assign it to a technician, and track it to completion.",
  Approvals: "Tyre replacement requests raised by your technicians.",
  Analytics: "A closer look at the health and cost of your operation.",
  Sites: "Manage the mine sites your fleet belongs to.",
  Users: "Create accounts and decide who can do what.",
  "Mine Map": "Geospatial overview of mine pits and operating machinery across South India.",
  "QR Lookup": "Scan a label or type a code to pull up any asset's live record in seconds.",
  "Live Sensors": "Tyre pressure and temperature streaming in, with instant alerts.",
  Assistant: "Ask plain-language questions and get answers from your fleet records.",
  "Audit Log": "A full record of every request, approval, rejection and completed job — who did it and when."
};
const EQUIPMENT_STATUSES = ["Active", "Under Repair", "Idle"];
const TYRE_STATUSES = ["Good", "Monitor", "Replace Soon", "Replaced"];
const SERVICE_STATUSES = ["Upcoming", "Overdue", "Completed"];
const EMPTY_LIST = [];

export default function Workspace() {
  const { user, logout } = useAuth();
  const role = user.role;
  const isAdmin = role === "admin";
  const nav = NAV[role] || NAV.technician;

  const [view, setView] = useState(HOME[role] || "Overview");
  const [site, setSite] = useState("All sites");
  const [sites, setSites] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [tyres, setTyres] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadWarning, setLoadWarning] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const [detail, setDetail] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const { lang, setLang, t } = useI18n();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // never show a screen the role is not allowed to open
  const activeView = [...nav.workspace, ...nav.tools].includes(view) ? view : HOME[role] || "Overview";

  /* ---------- load everything this role is allowed to see ---------- */
  const load = useCallback(async () => {
    const endpoints = ["equipment", "tyres", "maintenance", "sites"];
    if (can(role, "assignTask")) endpoints.push("users/assignable");
    if (role === "admin") endpoints.push("users");

    const results = await Promise.allSettled(endpoints.map((name) => api.get(`/${name}`)));
    const data = {};
    const failures = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        data[endpoints[i]] = Array.isArray(r.value.data) ? r.value.data : [];
      } else {
        const msg = r.reason?.response?.data?.message || r.reason?.message || "request failed";
        console.error(`[load] /${endpoints[i]} failed:`, r.reason);
        failures.push(`/${endpoints[i]} → ${msg}`);
        data[endpoints[i]] = [];
      }
    });

    try {
      const siteByEquipmentId = {};
      data.equipment.forEach((e) => {
        siteByEquipmentId[e._id] = e.site?.name || "Unassigned";
      });
      setSites(data.sites);
      setEquipment(data.equipment.map((e) => adaptEquipment(e)));
      setTyres(data.tyres.map((t) => adaptTyre(t, siteByEquipmentId)));
      setServices(data.maintenance.map((m) => adaptService(m, siteByEquipmentId)));
      setTechnicians((data["users/assignable"] || EMPTY_LIST).map((u) => adaptUser(u)));
      setUsers((data.users || EMPTY_LIST).map((u) => adaptUser(u)));
    } catch (err) {
      console.error("[load] processing error:", err);
      failures.push(`processing → ${err.message}`);
    }

    // everything failed -> blocking message; partial failure -> small warning, page still works
    setLoadError(failures.length >= endpoints.length ? `Could not load data. ${failures.join(" | ")}` : "");
    setLoadWarning(failures.length && failures.length < endpoints.length ? `Some data could not be loaded: ${failures.join(" | ")}` : "");
    setLoading(false);
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  // keep an open record dialog in sync after the data reloads
  useEffect(() => {
    setDetail((d) => {
      if (!d) return d;
      const list = d.kind === "equipment" ? equipment : d.kind === "tyre" ? tyres : services;
      return list.find((x) => x._id === d._id) || null;
    });
  }, [equipment, tyres, services]);

  /* ---------- derived data ---------- */
  const visibleEquipment = useMemo(() => equipment.filter((e) => site === "All sites" || e.site === site), [equipment, site]);
  const visibleTyres = useMemo(() => tyres.filter((t) => site === "All sites" || t.site === site), [tyres, site]);
  const visibleServices = useMemo(() => services.filter((s) => site === "All sites" || s.site === site), [services, site]);

  const soon = visibleTyres.filter((t) => t.status === "Replace Soon");
  const overdue = visibleServices.filter((s) => s.status === "Overdue");
  const pendingRequests = visibleTyres.filter((t) => t.request.status === "Pending");
  const activeCount = visibleEquipment.filter((e) => e.status === "Active").length;
  const healthyCount = visibleTyres.filter((t) => t.status === "Good").length;
  // spotlight the most worn tyre that is still in service (not one already replaced)
  const inService = visibleTyres.filter((t) => t.status !== "Replaced");
  const topTyre = inService.length
    ? [...inService].sort((a, b) => b.hours / b.threshold - a.hours / a.threshold)[0]
    : null;

  const q = search.toLowerCase();
  const allStatuses = filter === "All statuses";
  const filteredEquipment = visibleEquipment.filter((e) => `${e.name} ${e.id} ${e.model}`.toLowerCase().includes(q) && (allStatuses || e.status === filter));
  const filteredTyres = visibleTyres.filter((t) => `${t.id} ${t.brand} ${t.size} ${t.equipment} ${t.position}`.toLowerCase().includes(q) && (allStatuses || t.status === filter));
  const filteredServices = visibleServices.filter((s) => `${s.id} ${s.title} ${s.equipment} ${s.assignedTo}`.toLowerCase().includes(q) && (allStatuses || s.status === filter));

  const canAdd =
    (activeView === "Equipment" && can(role, "addEquipment")) ||
    (activeView === "Tyres" && can(role, "addTyre")) ||
    (activeView === "Maintenance" && can(role, "assignTask"));
  const addNoun = activeView === "Equipment" ? "equipment" : activeView === "Tyres" ? "tyre" : "job";

  /* ---------- actions (each one calls the API, then reloads the data) ---------- */
  function switchView(next) {
    setView(next);
    setSearch("");
    setFilter("All statuses");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const apiMessage = (err, fallback) => err.response?.data?.message || fallback;

  // run an API call; on success reload the data, on failure throw a readable message
  async function act(fn, fallback) {
    try {
      await fn();
    } catch (err) {
      throw new Error(apiMessage(err, fallback));
    }
    await load();
  }

  const actions = {
    complete: (item, note) => act(() => api.put(`/maintenance/${item._id}/complete`, { note }), "Could not complete the job."),
    updateHours: (item, hours) =>
      act(
        () =>
          api.patch(
            `/${item.kind === "equipment" ? "equipment" : "tyres"}/${item._id}/usage`,
            item.kind === "equipment" ? { totalUsageHours: Number(hours) } : { usageHours: Number(hours) }
          ),
        "Could not update the hours."
      ),
    requestReplacement: (item, reason) => act(() => api.post(`/tyres/${item._id}/request-replacement`, { reason }), "Could not send the request."),
    review: (item, body) => act(() => api.put(`/tyres/${item._id}/review-request`, body), "Could not save the decision."),
    goTo: (next) => {
      setDetail(null);
      switchView(next);
    },
    remove: async (item) => {
      if (!window.confirm(`Delete ${item.id}? This cannot be undone.`)) return;
      const path = item.kind === "equipment" ? "equipment" : item.kind === "tyre" ? "tyres" : "maintenance";
      try {
        await act(() => api.delete(`/${path}/${item._id}`), "Delete failed.");
        setDetail(null);
      } catch (err) {
        window.alert(err.message);
      }
    }
  };

  async function addRecord(formData) {
    setFormError("");
    const name = String(formData.get("name") || "").trim();
    if (!name) return;
    try {
      if (activeView === "Equipment") {
        await api.post("/equipment", {
          name,
          model: formData.get("model"),
          type: formData.get("type"),
          site: formData.get("site"),
          totalUsageHours: Number(formData.get("hours")) || 0
        });
      } else if (activeView === "Tyres") {
        await api.post("/tyres", {
          brand: name,
          size: formData.get("size"),
          equipment: formData.get("equipment"),
          position: formData.get("position"),
          usageHours: Number(formData.get("hours")) || 0,
          wearThresholdHours: Number(formData.get("threshold")) || 5000,
          cost: Number(formData.get("cost")) || 0
        });
      } else {
        await api.post("/maintenance", {
          targetType: formData.get("targetType"),
          targetId: formData.get("targetId"),
          assignedTo: formData.get("assignedTo"),
          description: name,
          nextDueDate: formData.get("date")
        });
      }
      setAddOpen(false);
      await load();
    } catch (err) {
      setFormError(apiMessage(err, "Could not save the record."));
    }
  }

  const handleExportCsv = () => {
    if (activeView === "Equipment") {
      const cols = [
        { header: "Equipment Name", accessor: (e) => e.name },
        { header: "Asset ID", accessor: (e) => e.id },
        { header: "Model", accessor: (e) => e.model },
        { header: "Type", accessor: (e) => e.type },
        { header: "Site", accessor: (e) => e.site },
        { header: "Usage Hours", accessor: (e) => e.hours },
        { header: "Status", accessor: (e) => e.status }
      ];
      exportToCsv("Equipment_Inventory", cols, filteredEquipment);
    } else if (activeView === "Tyres") {
      const cols = [
        { header: "Tyre Code", accessor: (t) => t.id },
        { header: "Brand & Model", accessor: (t) => t.brand },
        { header: "Size", accessor: (t) => t.size || "Standard" },
        { header: "Mounted Machine", accessor: (t) => t.equipment },
        { header: "Wheel Position", accessor: (t) => t.position },
        { header: "Usage Hours", accessor: (t) => t.hours },
        { header: "Threshold Hours", accessor: (t) => t.threshold },
        { header: "Wear %", accessor: (t) => Math.round((t.hours / t.threshold) * 100) },
        { header: "Health Score", accessor: (t) => tyreHealth(t).score },
        { header: "Status", accessor: (t) => t.status },
        { header: "Site", accessor: (t) => t.site }
      ];
      exportToCsv("Tyre_Inventory", cols, filteredTyres);
    } else if (activeView === "Maintenance") {
      const cols = [
        { header: "Job Title", accessor: (s) => s.title },
        { header: "Record ID", accessor: (s) => s.id },
        { header: "Category", accessor: (s) => s.category },
        { header: "Asset", accessor: (s) => s.equipment },
        { header: "Assigned Technician", accessor: (s) => s.assignedTo },
        { header: "Due Date", accessor: (s) => s.date },
        { header: "Cost (INR)", accessor: (s) => s.cost || 0 },
        { header: "Status", accessor: (s) => s.status },
        { header: "Site", accessor: (s) => s.site }
      ];
      exportToCsv("Maintenance_Work_Orders", cols, filteredServices);
    }
  };

  const handleExportPdf = () => {
    if (activeView === "Equipment") {
      const stats = [
        { label: "Total Machines", value: filteredEquipment.length },
        { label: "Active", value: filteredEquipment.filter((e) => e.status === "Active").length, note: "In operation" },
        { label: "Under Repair", value: filteredEquipment.filter((e) => e.status === "Under Repair").length, note: "Requires attention" }
      ];
      const cols = [
        { header: "Asset ID", accessor: (e) => e.id },
        { header: "Equipment", accessor: (e) => e.name },
        { header: "Model / Type", accessor: (e) => `${e.model} (${e.type})` },
        { header: "Site", accessor: (e) => e.site },
        { header: "Usage Hours", accessor: (e) => `${e.hours.toLocaleString()} hrs` },
        { header: "Status", accessor: (e) => e.status }
      ];
      exportPdfReport({
        title: "Fleet Equipment Master Inventory",
        subtitle: `Operational summary for ${site}`,
        siteName: site,
        stats,
        columns: cols,
        rows: filteredEquipment
      });
    } else if (activeView === "Tyres") {
      const stats = [
        { label: "Total Tyres", value: filteredTyres.length },
        { label: "Replace Soon", value: filteredTyres.filter((t) => t.status === "Replace Soon").length, note: "Wear > 90%" },
        { label: "Monitor", value: filteredTyres.filter((t) => t.status === "Monitor").length, note: "Wear 70-90%" }
      ];
      const cols = [
        { header: "Tyre Code", accessor: (t) => t.id },
        { header: "Brand & Size", accessor: (t) => `${t.brand} ${t.size || ""}` },
        { header: "Mounted On", accessor: (t) => `${t.equipment} (${t.position})` },
        { header: "Hours / Threshold", accessor: (t) => `${t.hours.toLocaleString()} / ${t.threshold.toLocaleString()}` },
        { header: "Health", accessor: (t) => `${tyreHealth(t).score}/100` },
        { header: "Condition", accessor: (t) => t.status }
      ];
      exportPdfReport({
        title: "Tyre Inventory & Condition Assessment Report",
        subtitle: `Tread wear analysis for ${site}`,
        siteName: site,
        stats,
        columns: cols,
        rows: filteredTyres
      });
    } else if (activeView === "Maintenance") {
      const stats = [
        { label: "Total Jobs", value: filteredServices.length },
        { label: "Overdue", value: filteredServices.filter((s) => s.status === "Overdue").length, note: "Urgent action" },
        { label: "Completed", value: filteredServices.filter((s) => s.status === "Completed").length, note: "Closed records" }
      ];
      const cols = [
        { header: "Job Title", accessor: (s) => s.title },
        { header: "Category", accessor: (s) => s.category },
        { header: "Asset", accessor: (s) => s.equipment },
        { header: "Assigned To", accessor: (s) => s.assignedTo },
        { header: "Due Date", accessor: (s) => fmtDate(s.date) },
        { header: "Status", accessor: (s) => s.status }
      ];
      exportPdfReport({
        title: "Maintenance Work Orders & Service Report",
        subtitle: `Preventative maintenance schedule for ${site}`,
        siteName: site,
        stats,
        columns: cols,
        rows: filteredServices
      });
    }
  };

  const initials = user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const mobileNav = [...nav.workspace, ...nav.tools];
  const hero = ROLE_HERO[role] || ROLE_HERO.technician;
  const noSite = !isAdmin && !loading && !loadError && sites.length === 0;
  const emptyAll = !loading && !loadError && !noSite && equipment.length === 0 && tyres.length === 0;

  const navButton = (label) => {
    const Icon = ICONS[label] || LayoutDashboard;
    return (
      <button key={label} className={`nav-button ${activeView === label ? "active" : ""}`} onClick={() => switchView(label)}>
        <Icon size={17} strokeWidth={1.9} />
        {t(label)}
        {label === "Approvals" && pendingRequests.length > 0 && <span className="nav-count">{pendingRequests.length}</span>}
      </button>
    );
  };

  const tableCount = activeView === "Equipment" ? filteredEquipment.length : activeView === "Tyres" ? filteredTyres.length : filteredServices.length;
  const roleChip = <span className={`role-chip ${role}`}>{ROLE_LABEL[role]}</span>;

  return (
    <div className="app-shell">
      {/* ================= Sidebar ================= */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-symbol"><HardHat size={22} strokeWidth={2.3} /></div>
          <div>
            <div className="brand-name">STRATA</div>
            <div className="brand-sub">FLEET INTELLIGENCE</div>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">{nav.workspace.map(navButton)}</nav>

        <div className="nav-label">TOOLS</div>
        {nav.tools.map(navButton)}

        <div className="sidebar-bottom">
          <div className="support-box">
            <LifeBuoy size={18} />
            <div className="support-title">{ROLE_LABEL[role]}</div>
            <div className="support-text">{isAdmin ? "You can see and manage every site." : `You are working at ${sites[0]?.name || "your site"}.`}</div>
          </div>
          <div className="user-row">
            <div className="avatar">{initials}</div>
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-role">{ROLE_LABEL[role]}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= Main column ================= */}
      <div className="main-col">
        <header className="topbar">
          <div className="topbar-left">
            <div className="brand-symbol small mobile-only"><HardHat size={18} /></div>
            <div className="crumb">Workspace <span className="crumb-sep">/</span> <strong>{activeView}</strong></div>
            <span className="top-divider" />
            <MapPin size={15} className="icon-muted" />
            {can(role, "switchSites") ? (
              <select aria-label="Select site" className="site-select" value={site} onChange={(e) => setSite(e.target.value)}>
                <option>All sites</option>
                {sites.map((s) => (
                  <option key={s._id}>{s.name}</option>
                ))}
              </select>
            ) : (
              <span className="site-chip">{sites[0]?.name || "No site assigned"}</span>
            )}
          </div>

          <div className="topbar-right">
            {/* Multi-Language Switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px 8px", borderRadius: 6 }}>
              <Globe size={14} className="icon-muted" />
              <select
                aria-label="Select language"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                style={{ background: "transparent", border: "none", fontSize: 12, fontWeight: 600, color: "#1e293b", cursor: "pointer", outline: "none" }}
              >
                <option value="en">English (EN)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>

            <NotificationCentre
              legacyAlerts={[
                ...(can(role, "reviewRequests") && pendingRequests.length > 0
                  ? [{ label: `${pendingRequests.length} replacement request${pendingRequests.length > 1 ? "s" : ""} pending`, onClick: () => switchView("Approvals") }]
                  : []),
                ...(role !== "technician" ? soon.map((t) => ({ label: `${t.id} · Replacement due soon`, onClick: () => setDetail(t) })) : []),
                ...overdue.map((s) => ({ label: `${s.title} · ${s.equipment} · overdue`, onClick: () => setDetail(s) }))
              ]}
            />
            <span className="top-divider" />
            <div className="avatar">{initials}</div>
            <div className="profile-label">
              <div className="user-name">{user.name}</div>
              {roleChip}
            </div>
            <Button variant="ghost" size="icon" className="top-icon" aria-label="Log out" title="Log out" onClick={logout}>
              <LogOut size={17} />
            </Button>
          </div>
        </header>

        {/* Offline indicator banner */}
        {!isOnline && (
          <div style={{ background: "#fffbeb", borderBottom: "1px solid #fef3c7", padding: "8px 20px", display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#b45309" }}>
            <WifiOff size={15} />
            <span><strong>Offline Mode:</strong> {t("offlineMsg")}</span>
          </div>
        )}

        <main className="main-content">
          <div className="page-head">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> {activeView.toUpperCase()} {roleChip}</div>
              <h1 className="display page-title">{activeView === "Overview" ? "Fleet overview" : activeView}</h1>
              <p className="subcopy">{SUBTITLES[activeView]}</p>
            </div>
            {canAdd && (
              <Button onClick={() => { setFormError(""); setAddOpen(true); }}>
                <Plus size={15} /> {activeView === "Maintenance" ? "Assign job" : `Add ${addNoun}`}
              </Button>
            )}
          </div>

          {loading && <div className="panel empty-state mt-24">Loading fleet data…</div>}
          {loadError && <div className="panel empty-state error-note mt-24">{loadError}</div>}
          {loadWarning && !loadError && <div className="panel pad error-note mt-24">{loadWarning}</div>}
          {noSite && <div className="panel empty-state mt-24">No site is assigned to your account yet. Ask an administrator to assign you to a site.</div>}
          {emptyAll && <div className="panel empty-state mt-24">No data yet. Run <code>npm run seed</code> in the backend folder, or add records.</div>}

          {/* ---------------- Technician home ---------------- */}
          {!loading && !loadError && activeView === "My Tasks" && (
            <MyTasksView services={visibleServices} tyres={visibleTyres} onOpen={setDetail} onComplete={actions.complete} goTo={actions.goTo} />
          )}

          {/* ---------------- Overview (admin + site manager) ---------------- */}
          {!loading && !loadError && activeView === "Overview" && (
            <>
              <section className="hero" aria-label="Mining fleet overview">
                <img src={haulTruck} alt="Large mining haul truck with giant tyres in an open-pit mine" />
                <div className="hero-content">
                  <div className="hero-kicker"><Activity size={14} /> {hero.kicker}</div>
                  <h2 className="hero-title">{hero.title}</h2>
                  <p className="hero-description">{hero.text}</p>
                  <Button className="hero-action" onClick={() => switchView(isAdmin ? "Users" : "Approvals")}>
                    {isAdmin ? "Manage people" : "Review requests"} <ArrowRight size={16} />
                  </Button>
                </div>
                <div className="hero-tag">{isAdmin ? sites.map((s) => s.name.toUpperCase()).join(" / ") || "ALL SITES" : (sites[0]?.name || "YOUR SITE").toUpperCase()}</div>
              </section>

              <section className="mt-32">
                <div className="between end">
                  <div>
                    <div className="section-label">LIVE SNAPSHOT</div>
                    <h2 className="display section-heading mt-4">At a glance</h2>
                  </div>
                  <span className="muted-small">{site === "All sites" ? (isAdmin ? "Across all sites" : sites[0]?.name || "") : site}</span>
                </div>
                <div className="metric-grid">
                  <Metric icon={Truck} value={visibleEquipment.length} label="Total equipment" note={`${activeCount} active`} />
                  <Metric icon={CircleAlert} value={soon.length} label="Tyres to replace" note="Needs action" tone="urgent" />
                  {isAdmin ? (
                    <Metric icon={Wrench} value={overdue.length} label="Overdue jobs" note="Review schedule" tone="warning" />
                  ) : (
                    <Metric icon={ClipboardCheck} value={pendingRequests.length} label="Awaiting your approval" note="Replacement requests" tone="warning" />
                  )}
                  {isAdmin ? (
                    <Metric icon={Users} value={users.length} label="Team members" note={`${users.filter((u) => u.role === "technician").length} technicians`} tone="good" />
                  ) : (
                    <Metric icon={ShieldCheck} value={healthyCount} label="Healthy tyres" note="Within threshold" tone="good" />
                  )}
                </div>
              </section>

              <div className="two-column">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <div className="section-label mb-4">ASSET STATUS</div>
                      <h2 className="display panel-title">Your fleet</h2>
                    </div>
                    <Button variant="ghost" className="text-link" onClick={() => switchView("Equipment")}>View all <ArrowRight size={13} /></Button>
                  </div>
                  <div className="fleet-list">
                    {visibleEquipment.slice(0, 4).map((e) => (
                      <button key={e.id} className="fleet-row" onClick={() => setDetail(e)}>
                        <div className="fleet-thumb"><img src={e.image} loading="lazy" alt={e.type} /></div>
                        <div className="min-0">
                          <div className="fleet-name truncate">{e.name} · {e.model}</div>
                          <div className="fleet-meta">{e.id} · {e.hours.toLocaleString()} hrs</div>
                        </div>
                        <span className={`status ${statusClass(e.status)}`}>{e.status}</span>
                      </button>
                    ))}
                    {!visibleEquipment.length && <div className="empty-state">No equipment here yet.</div>}
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <div className="section-label mb-4">WEAR WATCH</div>
                      <h2 className="display panel-title">Tyre spotlight</h2>
                    </div>
                    <Button variant="ghost" className="text-link" onClick={() => switchView("Tyres")}>View all <ArrowRight size={13} /></Button>
                  </div>
                  {topTyre ? (
                    <>
                      <div className="tyre-feature">
                        <img className="tyre-photo" src={tyrePhoto} loading="lazy" alt="Heavy-duty mining truck tyre" />
                        <div>
                          <span className={`status ${statusClass(topTyre.status)}`}>{topTyre.status}</span>
                          <strong>{topTyre.brand} {topTyre.size}</strong>
                          <p>{topTyre.equipment}<br />{topTyre.position}</p>
                        </div>
                      </div>
                      <div className="spot-usage">
                        <div className="between spot-label"><span>Usage vs. threshold</span><span>{Math.round((topTyre.hours / topTyre.threshold) * 100)}%</span></div>
                        <div className="progress-track">
                          <div className={`progress-fill ${statusClass(topTyre.status)}`} style={{ width: `${Math.min(100, (topTyre.hours / topTyre.threshold) * 100)}%` }} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">No tyres here yet.</div>
                  )}
                </section>
              </div>

              <div className="two-column">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <div className="section-label mb-4">KEEP THINGS MOVING</div>
                      <h2 className="display panel-title">Upcoming jobs</h2>
                    </div>
                    <Button variant="ghost" className="text-link" onClick={() => switchView("Maintenance")}>Open schedule <ArrowRight size={13} /></Button>
                  </div>
                  <div className="maintenance-list">
                    {visibleServices.filter((s) => s.status !== "Completed").slice(0, 4).map((s) => (
                      <button key={s._id} className="maintenance-row" onClick={() => setDetail(s)}>
                        <div className="maintenance-date">
                          <strong>{s.date.slice(8)}</strong>
                          <span>{new Date(`${s.date}T12:00:00`).toLocaleString("en-US", { month: "short" }).toUpperCase()}</span>
                        </div>
                        <div className="grow min-0">
                          <div className="row-title truncate">{s.title}</div>
                          <div className="muted-tiny">{s.equipment} · {s.assignedTo}</div>
                        </div>
                        <span className={`status ${statusClass(s.status)}`}>{s.status}</span>
                      </button>
                    ))}
                    {!visibleServices.some((s) => s.status !== "Completed") && <div className="empty-state">Nothing scheduled.</div>}
                  </div>
                </section>

                {isAdmin ? (
                  <TeamPanel users={users} sites={sites} />
                ) : (
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <div className="section-label mb-4">NEEDS YOUR DECISION</div>
                        <h2 className="display panel-title">Pending requests</h2>
                      </div>
                      <Button variant="ghost" className="text-link" onClick={() => switchView("Approvals")}>Review <ArrowRight size={13} /></Button>
                    </div>
                    <div className="maintenance-list">
                      {pendingRequests.slice(0, 3).map((t) => (
                        <button key={t._id} className="maintenance-row" onClick={() => switchView("Approvals")}>
                          <div className="grow min-0">
                            <div className="row-title truncate">{t.id} · {t.brand}</div>
                            <div className="muted-tiny">{t.equipment} · by {t.request.by || "technician"}</div>
                          </div>
                          <span className="status monitor">Pending</span>
                        </button>
                      ))}
                      {!pendingRequests.length && <div className="empty-state">No requests waiting.</div>}
                    </div>
                  </section>
                )}
              </div>

              {/* 30-Day Reorder Forecast Widget */}
              <ReorderForecast tyres={visibleTyres} selectedSite={site} />
            </>
          )}

          {/* ---------------- Approvals / Users / Sites ---------------- */}
          {!loading && !loadError && activeView === "Approvals" && <ApprovalsView tyres={visibleTyres} technicians={technicians} onReview={actions.review} />}
          {!loading && !loadError && activeView === "Users" && isAdmin && <UsersView users={users} sites={sites} currentUserId={user._id} onChanged={load} />}
          {!loading && !loadError && activeView === "Sites" && isAdmin && <SitesView sites={sites} equipment={equipment} onChanged={load} />}

          {/* ---------------- Tools ---------------- */}
          {!loading && !loadError && activeView === "Mine Map" && (
            <MineMap
              equipment={visibleEquipment}
              sites={sites}
              onOpen={(eq) => {
                switchView("Equipment");
                setDetail(eq);
              }}
            />
          )}
          {!loading && !loadError && activeView === "QR Lookup" && <QrLookup equipment={visibleEquipment} tyres={visibleTyres} onOpen={setDetail} />}
          {!loading && !loadError && activeView === "Live Sensors" && <SensorFeed tyres={visibleTyres} onOpen={setDetail} />}
          {!loading && !loadError && activeView === "Assistant" && (
            <Assistant equipment={equipment} tyres={tyres} services={services} siteNames={sites.map((s) => s.name)} onOpen={setDetail} />
          )}

          {/* ---------------- Analytics (admin + site manager only) ---------------- */}
          {!loading && !loadError && activeView === "Analytics" && (
            <div className="analytics-grid">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <div className="section-label mb-4">FLEET HEALTH</div>
                    <h2 className="display panel-title">Equipment status</h2>
                  </div>
                  <Gauge size={19} className="icon-muted" />
                </div>
                <div className="pad">
                  {EQUIPMENT_STATUSES.map((status) => {
                    const count = visibleEquipment.filter((e) => e.status === status).length;
                    return (
                      <div className="bar-row" key={status}>
                        <span>{status}</span>
                        <div className="progress-track"><div className={`progress-fill ${statusClass(status)}`} style={{ width: `${visibleEquipment.length ? (count / visibleEquipment.length) * 100 : 0}%` }} /></div>
                        <strong>{count}</strong>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <div className="section-label mb-4">TYRE HEALTH</div>
                    <h2 className="display panel-title">Wear distribution</h2>
                  </div>
                  <CircleAlert size={19} className="icon-muted" />
                </div>
                <div className="pad">
                  {["Good", "Monitor", "Replace Soon"].map((status) => {
                    const count = visibleTyres.filter((t) => t.status === status).length;
                    return (
                      <div className="bar-row" key={status}>
                        <span>{status}</span>
                        <div className="progress-track"><div className={`progress-fill ${statusClass(status)}`} style={{ width: `${visibleTyres.length ? (count / visibleTyres.length) * 100 : 0}%` }} /></div>
                        <strong>{count}</strong>
                      </div>
                    );
                  })}
                </div>
              </section>

              <BrandInsights tyres={visibleTyres} />
              <SpendChart tyres={visibleTyres} />

              <section className="panel span-all overflow-hidden">
                <img src={haulTruck} loading="lazy" className="analytics-img" alt="Mining haul truck in a quarry" />
                <div className="pad">
                  <div className="section-label">OPERATIONS SUMMARY</div>
                  <h2 className="display panel-title mt-8">Make every hour count.</h2>
                  <p className="muted-small mt-12">
                    {visibleEquipment.length} tracked machines · {visibleTyres.length} tracked tyres · {visibleServices.filter((s) => s.status !== "Completed").length} open jobs
                  </p>
                </div>
              </section>
            </div>
          )}

          {/* ---------------- Tyre diagram (shown above tyre table) ---------------- */}
          {!loading && !loadError && activeView === "Tyres" && visibleTyres.length > 0 && (
            <section className="panel" style={{ marginBottom: 16 }}>
              <div className="panel-heading">
                <div>
                  <div className="section-label mb-4">VISUAL LAYOUT</div>
                  <h2 className="display panel-title">Truck tyre map</h2>
                </div>
                <p className="muted-small" style={{ fontSize: 12 }}>Click a wheel to open that tyre's record</p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 24, padding: "0 20px 20px" }}>
                {equipment.slice(0, 4).map((eq) => {
                  const eqTyres = visibleTyres.filter((t) => t.equipment === eq.name);
                  if (!eqTyres.length) return null;
                  return (
                    <div key={eq._id} style={{ minWidth: 200 }}>
                      <div className="muted-small" style={{ marginBottom: 6, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{eq.name}</div>
                      <TyreDiagram tyres={eqTyres} onOpen={setDetail} />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ---------------- Audit Log (admin only) ---------------- */}
          {!loading && !loadError && activeView === "Audit Log" && isAdmin && <AuditLogView />}

          {/* ---------------- Equipment / Tyres / Maintenance tables ---------------- */}
          {!loading && !loadError && ["Equipment", "Tyres", "Maintenance"].includes(activeView) && (
            <>
              <div className="filterbar">
                <div className="search-wrap">
                  <Search size={16} />
                  <Input aria-label={`Search ${activeView.toLowerCase()}`} placeholder={`Search ${activeView.toLowerCase()} by name or ID...`} value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="filter-select" aria-label="Filter status" value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option>All statuses</option>
                  {(activeView === "Equipment" ? EQUIPMENT_STATUSES : activeView === "Tyres" ? TYRE_STATUSES : SERVICE_STATUSES).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <div className="push-right" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className="muted-small bold">{tableCount} records</span>
                  <Button size="sm" variant="outline" onClick={handleExportCsv} title="Download Excel CSV">
                    <Download size={13} /> {t("Excel / CSV")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleExportPdf} title="Generate PDF Report">
                    <FileText size={13} /> {t("Printable PDF")}
                  </Button>
                </div>
              </div>

              <div className="panel table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      {(activeView === "Equipment"
                        ? ["Equipment", "Asset ID", "Site", "Usage hours", "Status", ""]
                        : activeView === "Tyres"
                        ? ["Tyre", "Asset ID", "Mounted on", "Position", "Wear", "Health", "Replace in", "Request", "Status", ""]
                        : ["Job", "Record ID", "Asset", "Assigned to", "Due date", "Status", ""]
                      ).map((col, i) => <th key={i}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {activeView === "Equipment" && filteredEquipment.map((e) => (
                      <tr key={e._id}>
                        <td>
                          <div className="cell-flex">
                            <img src={e.image} loading="lazy" className="thumb-wide" alt="" />
                            <div><strong>{e.name}</strong><div className="muted-tiny">{e.model}</div></div>
                          </div>
                        </td>
                        <td>{e.id}</td>
                        <td>{e.site}</td>
                        <td>{e.hours.toLocaleString()} hrs</td>
                        <td><span className={`status ${statusClass(e.status)}`}>{e.status}</span></td>
                        <td><Button variant="ghost" size="icon" aria-label={`View ${e.name}`} onClick={() => setDetail(e)}><ArrowRight size={15} /></Button></td>
                      </tr>
                    ))}

                    {activeView === "Tyres" && filteredTyres.map((t) => {
                      const h = tyreHealth(t);
                      return (
                        <tr key={t._id}>
                          <td>
                            <div className="cell-flex">
                              <img src={tyrePhoto} loading="lazy" className="thumb-square" alt="" />
                              <div><strong>{t.brand}</strong><div className="muted-tiny">{t.size}</div></div>
                            </div>
                          </td>
                          <td>{t.id}</td>
                          <td>{t.equipment}</td>
                          <td>{t.position}</td>
                          <td>
                            <div className="wear-cell">
                              <div className="between wear-label"><span>{t.hours.toLocaleString()} hrs</span><span>{Math.round((t.hours / t.threshold) * 100)}%</span></div>
                              <div className="progress-track"><div className={`progress-fill ${statusClass(t.status)}`} style={{ width: `${Math.min(100, (t.hours / t.threshold) * 100)}%` }} /></div>
                            </div>
                          </td>
                          <td><span className={`health-badge ${healthTone(h.score)}`}>{h.score}</span></td>
                          <td>{h.daysLeft === 0 ? "Now" : `~${h.daysLeft} days`}</td>
                          <td>{t.request.status === "None" ? "—" : <span className={`status ${t.request.status === "Rejected" ? "critical" : t.request.status === "Pending" ? "monitor" : "good"}`}>{t.request.status}</span>}</td>
                          <td><span className={`status ${statusClass(t.status)}`}>{t.status}</span></td>
                          <td><Button variant="ghost" size="icon" aria-label={`View ${t.id}`} onClick={() => setDetail(t)}><ArrowRight size={15} /></Button></td>
                        </tr>
                      );
                    })}

                    {activeView === "Maintenance" && filteredServices.map((s) => (
                      <tr key={s._id}>
                        <td><strong>{s.title}</strong><div className="muted-tiny">{s.category}</div></td>
                        <td>{s.id}</td>
                        <td>{s.equipment}</td>
                        <td>{s.assignedTo}</td>
                        <td>{fmtDate(s.date)}</td>
                        <td><span className={`status ${statusClass(s.status)}`}>{s.status}</span></td>
                        <td><Button variant="ghost" size="icon" aria-label={`View ${s.id}`} onClick={() => setDetail(s)}><ArrowRight size={15} /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {tableCount === 0 && <div className="empty-state">No records match your search.</div>}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ================= Mobile bottom nav ================= */}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileNav.map((label) => {
          const Icon = ICONS[label] || LayoutDashboard;
          return (
            <button key={label} className={activeView === label ? "active" : ""} onClick={() => switchView(label)}>
              <Icon size={19} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* ================= Detail dialog ================= */}
      <Dialog
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? (detail.kind === "equipment" ? detail.name : detail.kind === "tyre" ? detail.brand : detail.title) : ""}
        description={detail ? `${detail.id} · ${detail.site}` : ""}
      >
        {detail && <DetailBody key={`${detail.kind}-${detail._id}`} detail={detail} role={role} actions={actions} />}
      </Dialog>

      {/* ================= Add dialog ================= */}
      <AddDialog
        open={addOpen}
        view={activeView}
        noun={addNoun}
        sites={sites}
        equipment={equipment}
        tyres={tyres}
        technicians={technicians}
        error={formError}
        onClose={() => setAddOpen(false)}
        onSubmit={addRecord}
      />
    </div>
  );
}