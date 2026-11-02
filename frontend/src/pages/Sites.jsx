import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Sites() {
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({ name: "", location: "" });

  const load = () => api.get("/sites").then((res) => setSites(res.data));
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/sites", form);
    setForm({ name: "", location: "" });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this site?")) return;
    await api.delete(`/sites/${id}`);
    load();
  };

  return (
    <div className="page">
      <h2>Sites</h2>
      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          placeholder="Site name (e.g. Site A - Jharkhand)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          required
        />
        <button type="submit">Add Site</button>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((s) => (
            <tr key={s._id}>
              <td>{s.name}</td>
              <td>{s.location}</td>
              <td>
                <button className="danger-btn" onClick={() => handleDelete(s._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
