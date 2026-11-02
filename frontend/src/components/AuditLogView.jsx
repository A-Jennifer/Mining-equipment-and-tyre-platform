/**
 * AuditLogView — admin-only page showing who did what and when.
 * Fetched from GET /api/audit, auto-refreshes every 15 s.
 */
import { useEffect, useState, useCallback } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import api from "../api/axios";

const ACTION_COLOR = {
  "Request raised":               "monitor",
  "Request approved · Job assigned": "good",
  "Request rejected":             "critical",
  "Job completed":                "neutral"
};

function timeFmt(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function AuditLogView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/audit");
      setLogs(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load audit log");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const q = search.toLowerCase();
  const filtered = logs.filter(
    (l) =>
      !q ||
      l.action?.toLowerCase().includes(q) ||
      l.actor?.toLowerCase().includes(q) ||
      l.detail?.toLowerCase().includes(q) ||
      l.site?.toLowerCase().includes(q)
  );

  return (
    <div className="stack">
      <div className="between">
        <div className="search-wrap" style={{ maxWidth: 320 }}>
          <input
            className="filter-select"
            style={{ width: "100%", padding: "0 12px", height: 36 }}
            placeholder="Search by action, user or detail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="btn v-ghost s-icon"
          aria-label="Refresh"
          onClick={load}
          title="Refresh"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px", height: 36, border: "1px solid var(--border)", borderRadius: 8, background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {loading && <div className="panel empty-state">Loading audit log…</div>}
      {error   && <div className="panel empty-state error-note">{error}</div>}

      {!loading && !error && (
        <div className="panel table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Detail</th>
                <th>Site</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l._id}>
                  <td style={{ whiteSpace: "nowrap", color: "var(--text-muted)", fontSize: 12 }}>
                    {timeFmt(l.createdAt)}
                  </td>
                  <td>
                    <span className={`status ${ACTION_COLOR[l.action] || "neutral"}`}>{l.action}</span>
                  </td>
                  <td><strong>{l.actor}</strong></td>
                  <td>
                    <span className={`role-chip ${l.role || ""}`}>
                      {l.role === "site_manager" ? "Manager" : l.role === "admin" ? "Admin" : "Technician"}
                    </span>
                  </td>
                  <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.detail || "—"}
                  </td>
                  <td>{l.site || "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state" style={{ padding: "32px 0" }}>
                      <ClipboardList size={32} style={{ margin: "0 auto 8px", display: "block", opacity: 0.3 }} />
                      {logs.length === 0 ? "No events recorded yet. Actions like requests and approvals will appear here." : "No results match your search."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
