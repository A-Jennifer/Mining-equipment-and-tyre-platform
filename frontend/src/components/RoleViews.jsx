import { useState } from "react";
import { Check, CircleAlert, ListChecks, Pencil, Plus, QrCode, Radio, ShieldCheck, Trash2, Wrench, X } from "lucide-react";
import api from "../api/axios";
import { Button, Dialog, Input } from "./ui";
import { Metric } from "./Parts";
import { fmtDate, statusClass } from "../lib/fleet";
import { ROLE_LABEL } from "../lib/roles";

const apiMessage = (err, fallback) => err.response?.data?.message || err.message || fallback;

/* =====================================================================
   TECHNICIAN HOME: "My Tasks"
   ===================================================================== */
export function MyTasksView({ services, tyres, onOpen, onComplete, goTo }) {
  const [error, setError] = useState("");
  const open = services.filter((s) => s.status !== "Completed").sort((a, b) => a.date.localeCompare(b.date));
  const overdue = open.filter((s) => s.status === "Overdue");
  const done = services.filter((s) => s.status === "Completed").sort((a, b) => b.date.localeCompare(a.date));
  const attention = tyres
    .filter((t) => t.status === "Replace Soon" || t.status === "Monitor")
    .sort((a, b) => b.hours / b.threshold - a.hours / a.threshold);

  async function quickComplete(task) {
    setError("");
    try {
      await onComplete(task, "");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="metric-grid">
        <Metric icon={ListChecks} value={open.length} label="Open jobs" note="Assigned to you" />
        <Metric icon={Wrench} value={overdue.length} label="Overdue" note="Do these first" tone="warning" />
        <Metric icon={CircleAlert} value={attention.filter((t) => t.status === "Replace Soon").length} label="Tyres to flag" note="At your site" tone="urgent" />
        <Metric icon={ShieldCheck} value={done.length} label="Completed" note="All time" tone="good" />
      </div>
      {error && <p className="error-note">{error}</p>}

      <div className="two-column">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="section-label mb-4">ASSIGNED TO YOU</div>
              <h2 className="display panel-title">My open jobs</h2>
            </div>
          </div>
          <div className="maintenance-list">
            {open.map((s) => (
              <div key={s._id} className="maintenance-row">
                <div className="maintenance-date">
                  <strong>{s.date.slice(8)}</strong>
                  <span>{new Date(`${s.date}T12:00:00`).toLocaleString("en-US", { month: "short" }).toUpperCase()}</span>
                </div>
                <button className="task-main" onClick={() => onOpen(s)}>
                  <div className="row-title truncate">{s.title}</div>
                  <div className="muted-tiny">{s.equipment} · {s.category}</div>
                </button>
                <span className={`status ${statusClass(s.status)}`}>{s.status}</span>
                <Button size="sm" onClick={() => quickComplete(s)}><Check size={13} /> Done</Button>
              </div>
            ))}
            {!open.length && <div className="empty-state">You're all caught up. No open jobs.</div>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="section-label mb-4">FIELD TOOLS</div>
              <h2 className="display panel-title">Quick actions</h2>
            </div>
          </div>
          <div className="quick-actions">
            <Button variant="outline" onClick={() => goTo("QR Lookup")}><QrCode size={15} /> Scan an asset QR</Button>
            <Button variant="outline" onClick={() => goTo("Live Sensors")}><Radio size={15} /> Live tyre sensors</Button>
          </div>
        </section>
      </div>

      <section className="panel mt-16">
        <div className="panel-heading">
          <div>
            <div className="section-label mb-4">WEAR WATCH</div>
            <h2 className="display panel-title">Tyres at your site that need attention</h2>
          </div>
        </div>
        <div className="maintenance-list">
          {attention.slice(0, 6).map((t) => (
            <button key={t._id} className="maintenance-row" onClick={() => onOpen(t)}>
              <div className="grow min-0">
                <div className="row-title truncate">{t.id} · {t.brand}</div>
                <div className="muted-tiny">{t.equipment} · {t.position} · {Math.round((t.hours / t.threshold) * 100)}% worn</div>
              </div>
              {t.request.status !== "None" && <span className="status neutral">Request: {t.request.status}</span>}
              <span className={`status ${statusClass(t.status)}`}>{t.status}</span>
            </button>
          ))}
          {!attention.length && <div className="empty-state">No worn tyres at your site right now.</div>}
        </div>
      </section>

      {done.length > 0 && (
        <section className="panel mt-16">
          <div className="panel-heading">
            <div>
              <div className="section-label mb-4">HISTORY</div>
              <h2 className="display panel-title">Recently completed</h2>
            </div>
          </div>
          <div className="maintenance-list">
            {done.slice(0, 4).map((s) => (
              <button key={s._id} className="maintenance-row" onClick={() => onOpen(s)}>
                <div className="grow min-0">
                  <div className="row-title truncate">{s.title}</div>
                  <div className="muted-tiny">{s.equipment}{s.completedAt ? ` · done ${fmtDate(s.completedAt)}` : ""}</div>
                </div>
                <span className="status good">Completed</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* =====================================================================
   MANAGER / ADMIN: "Approvals"  (tyre replacement requests)
   ===================================================================== */
function RequestCard({ tyre, technicians, onReview }) {
  const siteTechs = technicians.filter((u) => u.site === tyre.site);
  const [tech, setTech] = useState(siteTechs[0]?._id || "");
  const [due, setDue] = useState(() => new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function decide(decision) {
    setError("");
    setBusy(true);
    try {
      await onReview(tyre, { decision, note, assignedTo: decision === "Approved" ? tech : undefined, dueDate: decision === "Approved" ? due : undefined });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <article className="panel request-card">
      <div className="between">
        <div>
          <strong>{tyre.id} · {tyre.brand}</strong> <span className="muted-small">{tyre.size}</span>
          <div className="muted-small">{tyre.equipment} · {tyre.position} · {tyre.site}</div>
        </div>
        <span className="status critical">{Math.round((tyre.hours / tyre.threshold) * 100)}% worn</span>
      </div>
      <p className="request-reason">
        “{tyre.request.reason}” <span className="muted-small">— {tyre.request.by || "technician"}{tyre.request.at ? `, ${fmtDate(String(tyre.request.at).slice(0, 10))}` : ""}</span>
      </p>
      <div className="request-controls">
        <label className="field">Assign to
          <select className="filter-select full" value={tech} onChange={(e) => setTech(e.target.value)}>
            {siteTechs.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        </label>
        <label className="field">Due date
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        <label className="field">Note (optional)
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Message for the technician" />
        </label>
      </div>
      {!siteTechs.length && <p className="error-note">No active technician at this site to assign.</p>}
      {error && <p className="error-note">{error}</p>}
      <div className="row-gap mt-12">
        <Button disabled={busy || !tech || !due} onClick={() => decide("Approved")}><Check size={15} /> Approve & assign</Button>
        <Button variant="danger" disabled={busy} onClick={() => decide("Rejected")}><X size={15} /> Reject</Button>
      </div>
    </article>
  );
}

export function ApprovalsView({ tyres, technicians, onReview }) {
  const pending = tyres.filter((t) => t.request.status === "Pending");
  const history = tyres.filter((t) => ["Approved", "Rejected", "Completed"].includes(t.request.status));

  return (
    <div className="stack">
      {pending.length === 0 && <div className="panel empty-state">No tyre replacement requests are waiting for a decision.</div>}
      {pending.map((t) => (
        <RequestCard key={t._id} tyre={t} technicians={technicians} onReview={onReview} />
      ))}

      {history.length > 0 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="section-label mb-4">DECISIONS</div>
              <h2 className="display panel-title">Request history</h2>
            </div>
          </div>
          <div className="maintenance-list">
            {history.map((t) => (
              <div key={t._id} className="maintenance-row">
                <div className="grow min-0">
                  <div className="row-title truncate">{t.id} · {t.brand} · {t.equipment}</div>
                  <div className="muted-tiny">{t.request.by ? `Raised by ${t.request.by}` : "Request"}{t.request.note ? ` · “${t.request.note}”` : ""}</div>
                </div>
                <span className={`status ${t.request.status === "Rejected" ? "critical" : "good"}`}>{t.request.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* =====================================================================
   ADMIN: Users
   ===================================================================== */
function UserDialog({ user, sites, onClose, onSaved }) {
  const editing = Boolean(user);
  const [role, setRole] = useState(user?.role || "technician");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const body = { name: f.get("name"), role, site: role === "admin" ? undefined : f.get("site") };
    if (f.get("password")) body.password = f.get("password");
    try {
      if (editing) {
        body.isActive = f.get("isActive") === "on";
        await api.put(`/users/${user._id}`, body);
      } else {
        body.email = f.get("email");
        await api.post("/users", body);
      }
      onSaved();
    } catch (err) {
      setError(apiMessage(err, "Could not save the user."));
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title={editing ? "Edit user" : "Add user"} description="Choose a role and a site. Managers and technicians only ever see their own site.">
      <form className="form-stack" onSubmit={submit}>
        <label className="field">Full name<Input name="name" required defaultValue={user?.name || ""} /></label>
        <label className="field">Email<Input name="email" type="email" required={!editing} disabled={editing} defaultValue={user?.email || ""} /></label>
        <label className="field">{editing ? "New password (leave blank to keep)" : "Password"}
          <Input name="password" type="password" minLength={6} required={!editing} autoComplete="new-password" />
        </label>
        <label className="field">Role
          <select className="filter-select full" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="technician">Technician</option>
            <option value="site_manager">Site Manager</option>
            <option value="admin">Administrator</option>
          </select>
        </label>
        {role !== "admin" && (
          <label className="field">Site
            <select name="site" className="filter-select full" required defaultValue={user?.siteId || sites[0]?._id}>
              {sites.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </label>
        )}
        {editing && (
          <label className="check-row">
            <input name="isActive" type="checkbox" defaultChecked={user.isActive} /> Account is active
          </label>
        )}
        {error && <p className="error-note">{error}</p>}
        <Button type="submit" className="full" disabled={busy}>{editing ? "Save changes" : <><Plus size={15} /> Create user</>}</Button>
      </form>
    </Dialog>
  );
}

export function UsersView({ users, sites, currentUserId, onChanged }) {
  const [dialog, setDialog] = useState(null); // null | "new" | user
  const [error, setError] = useState("");

  async function remove(u) {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    setError("");
    try {
      await api.delete(`/users/${u._id}`);
      onChanged();
    } catch (err) {
      setError(apiMessage(err, "Delete failed."));
    }
  }

  return (
    <div className="stack">
      <div className="between">
        <span className="muted-small">{users.length} accounts</span>
        <Button onClick={() => setDialog("new")}><Plus size={15} /> Add user</Button>
      </div>
      {error && <p className="error-note">{error}</p>}
      <div className="panel table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Site</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td><span className={`role-chip ${u.role}`}>{ROLE_LABEL[u.role] || u.role}</span></td>
                <td>{u.site || "All sites"}</td>
                <td><span className={`status ${u.isActive ? "good" : "neutral"}`}>{u.isActive ? "Active" : "Deactivated"}</span></td>
                <td>
                  <div className="row-gap">
                    <Button variant="ghost" size="icon" aria-label={`Edit ${u.name}`} onClick={() => setDialog(u)}><Pencil size={15} /></Button>
                    {u._id !== currentUserId && (
                      <Button variant="ghost" size="icon" aria-label={`Delete ${u.name}`} onClick={() => remove(u)}><Trash2 size={15} /></Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialog && (
        <UserDialog
          user={dialog === "new" ? null : dialog}
          sites={sites}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

/* ADMIN overview panel: who works where */
export function TeamPanel({ users, sites }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <div className="section-label mb-4">PEOPLE</div>
          <h2 className="display panel-title">Team by site</h2>
        </div>
      </div>
      <div className="maintenance-list">
        {sites.map((s) => {
          const people = users.filter((u) => u.site === s.name);
          const manager = people.find((u) => u.role === "site_manager");
          return (
            <div key={s._id} className="maintenance-row">
              <div className="grow min-0">
                <div className="row-title truncate">{s.name}</div>
                <div className="muted-tiny">Manager: {manager ? manager.name : "none assigned"}</div>
              </div>
              <span className="status neutral">{people.filter((u) => u.role === "technician").length} technicians</span>
            </div>
          );
        })}
        {!sites.length && <div className="empty-state">No sites yet.</div>}
      </div>
    </section>
  );
}