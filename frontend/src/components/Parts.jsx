import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Plus, Trash2 } from "lucide-react";
import api from "../api/axios";
import { Button, Dialog, Input } from "./ui";
import { currency } from "../lib/fleet";

const PRIMARY = "#edae12";
const POSITIONS = ["Front-Left", "Front-Right", "Rear-Left", "Rear-Left-Inner", "Rear-Right", "Rear-Right-Inner", "Other"];

export function Metric({ icon: Icon, value, label, note, tone = "" }) {
  return (
    <div className={`metric ${tone}`}>
      <div className="metric-icon"><Icon size={17} strokeWidth={1.9} /></div>
      <div className="metric-value">{String(value).padStart(2, "0")}</div>
      <div className="metric-title">{label}</div>
      <div className="metric-note">{note}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
export function SpendChart({ tyres }) {
  const byBrand = {};
  tyres.forEach((t) => {
    byBrand[t.brand] = byBrand[t.brand] || { brand: t.brand, spend: 0 };
    byBrand[t.brand].spend += t.cost || 0;
  });
  const data = Object.values(byBrand);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <div className="section-label mb-4">REPLACEMENT SPEND</div>
          <h2 className="display panel-title">Tyre cost by brand</h2>
        </div>
        <BarChart3 size={19} className="icon-muted" />
      </div>
      <div className="chart-pad">
        {data.length ? (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2dfd9" />
              <XAxis dataKey="brand" tick={{ fontSize: 10 }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${Math.round(v / 100000)}L`} />
              <Tooltip formatter={(v) => currency(v)} />
              <Bar dataKey="spend" name="Total cost" fill={PRIMARY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">No tyre data yet.</div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function SitesView({ sites, equipment, onChanged }) {
  const [form, setForm] = useState({ name: "", location: "", thresholdWarning: 70, thresholdCritical: 90 });
  const [editingId, setEditingId] = useState(null);
  const [editLimits, setEditLimits] = useState({ warning: 70, critical: 90 });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function addSite(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/sites", form);
      setForm({ name: "", location: "", thresholdWarning: 70, thresholdCritical: 90 });
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add the site.");
    }
  }

  async function saveLimits(siteId) {
    setSaving(true);
    try {
      await api.put(`/sites/${siteId}`, {
        thresholdWarning: Number(editLimits.warning),
        thresholdCritical: Number(editLimits.critical)
      });
      setEditingId(null);
      onChanged();
    } catch (err) {
      alert("Failed to update thresholds: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  }

  async function removeSite(s) {
    if (!window.confirm(`Delete ${s.name}?`)) return;
    try {
      await api.delete(`/sites/${s._id}`);
      onChanged();
    } catch (err) {
      window.alert(err.response?.data?.message || "Delete failed.");
    }
  }

  return (
    <div className="stack">
      <div className="panel pad" style={{ marginBottom: 12 }}>
        <div className="section-label mb-4">SITE THRESHOLD ADMINISTRATION</div>
        <h2 className="display panel-title">Mine Sites & Wear Threshold Configurations</h2>
        <p className="muted-small mt-4">
          Configure site-specific wear thresholds. The early warning ('Monitor') and critical limit ('Replace Soon') adjust health scores dynamically.
        </p>
      </div>

      <form className="panel pad site-form" onSubmit={addSite}>
        <Input placeholder="Site name (e.g. Jharia OCP)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
        <Button type="submit"><Plus size={15} /> Add site</Button>
      </form>
      {error && <p className="error-note">{error}</p>}
      <div className="panel table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Site</th>
              <th>Location</th>
              <th>Machines</th>
              <th>Warning Limit (Monitor)</th>
              <th>Critical Limit (Replace Soon)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((s) => (
              <tr key={s._id}>
                <td><strong>{s.name}</strong></td>
                <td>{s.location}</td>
                <td>{equipment.filter((e) => e.site === s.name).length}</td>
                <td>
                  {editingId === s._id ? (
                    <input
                      type="number"
                      min="40"
                      max="85"
                      value={editLimits.warning}
                      onChange={(e) => setEditLimits({ ...editLimits, warning: e.target.value })}
                      style={{ width: 70, padding: "3px 6px", borderRadius: 4, border: "1px solid #cbd5e1" }}
                    />
                  ) : (
                    <span className="status monitor">{s.thresholdWarning || 70}% wear</span>
                  )}
                </td>
                <td>
                  {editingId === s._id ? (
                    <input
                      type="number"
                      min="75"
                      max="98"
                      value={editLimits.critical}
                      onChange={(e) => setEditLimits({ ...editLimits, critical: e.target.value })}
                      style={{ width: 70, padding: "3px 6px", borderRadius: 4, border: "1px solid #cbd5e1" }}
                    />
                  ) : (
                    <span className="status critical">{s.thresholdCritical || 90}% wear</span>
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    {editingId === s._id ? (
                      <>
                        <Button size="sm" onClick={() => saveLimits(s._id)} disabled={saving}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(s._id);
                          setEditLimits({ warning: s.thresholdWarning || 70, critical: s.thresholdCritical || 90 });
                        }}
                      >
                        Set Limits
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => removeSite(s)}><Trash2 size={13} /> Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!sites.length && <div className="empty-state">No sites yet.</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
// "Add" dialog for equipment, tyres and work orders (assigning a job to a technician)
export function AddDialog({ open, view, noun, sites, equipment, tyres, technicians, error, onClose, onSubmit }) {
  const [targetType, setTargetType] = useState("Equipment");
  const [targetId, setTargetId] = useState("");

  const targets =
    targetType === "Equipment"
      ? equipment.map((e) => ({ value: e._id, label: `${e.name} · ${e.model}`, site: e.site }))
      : tyres.map((t) => ({ value: t._id, label: `${t.id} · ${t.brand}`, site: t.site }));
  const selected = targets.find((t) => t.value === targetId) || targets[0];
  const techs = technicians.filter((u) => !selected || u.site === selected.site);

  return (
    <Dialog open={open} onClose={onClose} title={view === "Maintenance" ? "Assign a job" : `Add ${noun}`} description="The record is saved to the database.">
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(new FormData(e.currentTarget));
        }}
      >
        <label className="field">
          {view === "Equipment" ? "Asset tag" : view === "Tyres" ? "Tyre brand / model" : "Job title"}
          <Input name="name" required placeholder={view === "Equipment" ? "e.g. HT-103" : view === "Tyres" ? "e.g. Michelin XDR2" : "e.g. Hydraulic inspection"} />
        </label>

        {view === "Equipment" && (
          <>
            <label className="field">Machine model
              <Input name="model" placeholder="e.g. Caterpillar 793F" />
            </label>
            <label className="field">Type
              <select name="type" className="filter-select full">
                <option>Dump Truck</option><option>Excavator</option><option>Loader</option><option>Driller</option><option>Grader</option><option>Other</option>
              </select>
            </label>
            <label className="field">Site
              <select name="site" className="filter-select full" required>
                {sites.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </label>
            <label className="field">Usage hours
              <Input name="hours" type="number" min="0" defaultValue="0" required />
            </label>
          </>
        )}

        {view === "Tyres" && (
          <>
            <label className="field">Mounted on
              <select name="equipment" className="filter-select full" required>
                {equipment.map((e) => <option key={e._id} value={e._id}>{e.name} · {e.model}</option>)}
              </select>
            </label>
            <div className="field-row">
              <label className="field">Size<Input name="size" placeholder="e.g. 40.00R57" /></label>
              <label className="field">Position
                <select name="position" className="filter-select full">
                  {POSITIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
            </div>
            <div className="field-row">
              <label className="field">Usage hours<Input name="hours" type="number" min="0" defaultValue="0" required /></label>
              <label className="field">Wear threshold<Input name="threshold" type="number" min="1" defaultValue="5000" required /></label>
            </div>
            <label className="field">Cost (₹)
              <Input name="cost" type="number" min="0" defaultValue="0" />
            </label>
          </>
        )}

        {view === "Maintenance" && (
          <>
            <label className="field">Applies to
              <select name="targetType" className="filter-select full" value={targetType} onChange={(e) => { setTargetType(e.target.value); setTargetId(""); }}>
                <option>Equipment</option><option>Tyre</option>
              </select>
            </label>
            <label className="field">{targetType}
              <select name="targetId" className="filter-select full" required value={selected ? selected.value : ""} onChange={(e) => setTargetId(e.target.value)}>
                {targets.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label className="field">Assign to technician
              <select key={selected ? selected.value : "none"} name="assignedTo" className="filter-select full" required>
                {techs.map((u) => <option key={u._id} value={u._id}>{u.name} · {u.site}</option>)}
              </select>
            </label>
            {!techs.length && <p className="error-note">No active technician at this asset's site. Ask an administrator to add one.</p>}
            <label className="field">Due date
              <Input name="date" type="date" required />
            </label>
          </>
        )}

        {error && <p className="error-note">{error}</p>}
        <Button type="submit" className="full"><Plus size={15} /> {view === "Maintenance" ? "Assign job" : "Add record"}</Button>
      </form>
    </Dialog>
  );
}