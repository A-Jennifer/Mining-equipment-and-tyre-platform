import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { TyreIllustration } from "../components/illustrations";

function usageInfo(tyre) {
  const pct = Math.min(100, Math.round((tyre.usageHours / tyre.wearThresholdHours) * 100));
  let cls = "good";
  if (tyre.status === "Replace Soon") cls = "replace";
  else if (tyre.status === "Monitor") cls = "monitor";
  return { pct, cls };
}

const CLASS_COLOR = { good: "#16a34a", monitor: "#d97706", replace: "#dc2626" };

export default function Tyres() {
  const { user } = useAuth();
  const [tyres, setTyres] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [qrItem, setQrItem] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [form, setForm] = useState({
    brand: "",
    equipment: "",
    position: "Front-Left",
    usageHours: 0,
    wearThresholdHours: 3000,
    cost: 0
  });

  const load = () => {
    api.get("/tyres").then((res) => setTyres(res.data));
    api.get("/equipment").then((res) => setEquipmentList(res.data));
  };

  useEffect(load, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/tyres", form);
    setForm({ brand: "", equipment: "", position: "Front-Left", usageHours: 0, wearThresholdHours: 3000, cost: 0 });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this tyre?")) return;
    await api.delete(`/tyres/${id}`);
    load();
  };

  const filteredTyres = useMemo(() => {
    return tyres.filter((t) => {
      const matchesSearch =
        !search ||
        t.tyreCode.toLowerCase().includes(search.toLowerCase()) ||
        t.brand.toLowerCase().includes(search.toLowerCase()) ||
        (t.equipment?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tyres, search, statusFilter]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Tyre Management</h2>
          <p className="subtitle">
            {tyres.length} tyres tracked · {tyres.filter((t) => t.status === "Replace Soon").length} need replacement
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Tyre</button>
      </div>

      <div className="tyre-toolbar">
        <input
          type="text"
          placeholder="Search by tyre code, brand, or equipment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Good">Good</option>
          <option value="Monitor">Monitor</option>
          <option value="Replace Soon">Replace Soon</option>
          <option value="Replaced">Replaced</option>
        </select>
      </div>

      {filteredTyres.length === 0 ? (
        <div className="empty-state">No tyres match your search.</div>
      ) : (
        <div className="tyre-grid">
          {filteredTyres.map((t) => {
            const { pct, cls } = usageInfo(t);
            return (
              <div className="tyre-card" key={t._id}>
                <div className="tyre-card-top">
                  <div className="tyre-card-id">
                    <span className={`tyre-icon-badge ${cls}`}>
                      <TyreIllustration size={20} color={CLASS_COLOR[cls]} />
                    </span>
                    <div>
                      <div className="tyre-card-code">{t.tyreCode}</div>
                      <div className="tyre-card-sub">{t.brand} · {t.position}</div>
                    </div>
                  </div>
                  <span className={`badge status-${t.status.replace(/\s/g, "-")}`}>{t.status}</span>
                </div>

                <div className="tyre-card-meta">
                  Mounted on <b>{t.equipment?.name || "—"}</b>
                </div>

                <div>
                  <div className="usage-bar-labels">
                    <span>{t.usageHours} / {t.wearThresholdHours} hrs</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="usage-bar">
                    <div className={`usage-bar-fill ${cls}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>

                <div className="tyre-card-footer">
                  <button className="link-btn" onClick={() => setQrItem(t)}>View QR Code</button>
                  <div className="actions">
                    <span className="tyre-card-sub">₹{t.cost}</span>
                    {user.role === "admin" && (
                      <button className="danger-btn" onClick={() => handleDelete(t._id)}>Delete</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>Add New Tyre</h3>
            <form className="modal-form" onSubmit={handleSubmit}>
              <label>Brand</label>
              <input name="brand" value={form.brand} onChange={handleChange} required />

              <label>Equipment</label>
              <select name="equipment" value={form.equipment} onChange={handleChange} required>
                <option value="">Select Equipment</option>
                {equipmentList.map((e) => (
                  <option key={e._id} value={e._id}>{e.name}</option>
                ))}
              </select>

              <label>Position</label>
              <select name="position" value={form.position} onChange={handleChange}>
                <option>Front-Left</option>
                <option>Front-Right</option>
                <option>Rear-Left</option>
                <option>Rear-Right</option>
                <option>Other</option>
              </select>

              <label>Usage Hours</label>
              <input type="number" name="usageHours" value={form.usageHours} onChange={handleChange} />

              <label>Wear Threshold (hrs)</label>
              <input type="number" name="wearThresholdHours" value={form.wearThresholdHours} onChange={handleChange} />

              <label>Cost (₹)</label>
              <input type="number" name="cost" value={form.cost} onChange={handleChange} />

              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit">Save Tyre</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrItem && (
        <div className="modal-overlay" onClick={() => setQrItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{qrItem.tyreCode}</h3>
            <QRCodeSVG value={qrItem.qrCode} size={200} />
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 10 }}>Code: {qrItem.qrCode}</p>
            <button onClick={() => setQrItem(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}