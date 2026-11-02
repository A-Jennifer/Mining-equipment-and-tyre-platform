import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const EQUIPMENT_TYPES = ["Dump Truck", "Excavator", "Driller", "Loader", "Other"];

export default function Equipment() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [sites, setSites] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Dump Truck", site: "", status: "Active" });
  const [qrItem, setQrItem] = useState(null);

  const canEdit = user.role === "admin" || user.role === "site_manager";

  const load = () => {
    api.get("/equipment").then((res) => setEquipment(res.data));
    api.get("/sites").then((res) => setSites(res.data));
  };

  useEffect(load, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/equipment", form);
    setForm({ name: "", type: "Dump Truck", site: "", status: "Active" });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this equipment?")) return;
    await api.delete(`/equipment/${id}`);
    load();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Equipment</h2>
        {canEdit && (
          <button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Add Equipment"}</button>
        )}
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleSubmit}>
          <input name="name" placeholder="Name (e.g. Truck-01)" value={form.name} onChange={handleChange} required />
          <select name="type" value={form.type} onChange={handleChange}>
            {EQUIPMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select name="site" value={form.site} onChange={handleChange} required>
            <option value="">Select Site</option>
            {sites.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <select name="status" value={form.status} onChange={handleChange}>
            <option>Active</option>
            <option>Under Repair</option>
            <option>Idle</option>
          </select>
          <button type="submit">Save</button>
        </form>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Site</th>
            <th>Status</th>
            <th>Usage Hours</th>
            <th>QR Code</th>
            {user.role === "admin" && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {equipment.map((item) => (
            <tr key={item._id}>
              <td>{item.name}</td>
              <td>{item.type}</td>
              <td>{item.site?.name || "-"}</td>
              <td><span className={`badge status-${item.status.replace(/\s/g, "-")}`}>{item.status}</span></td>
              <td>{item.totalUsageHours}</td>
              <td>
                <button className="link-btn" onClick={() => setQrItem(item)}>View QR</button>
              </td>
              {user.role === "admin" && (
                <td>
                  <button className="danger-btn" onClick={() => handleDelete(item._id)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {qrItem && (
        <div className="modal-overlay" onClick={() => setQrItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{qrItem.name}</h3>
            <QRCodeSVG value={qrItem.qrCode} size={200} />
            <p>Code: {qrItem.qrCode}</p>
            <button onClick={() => setQrItem(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
