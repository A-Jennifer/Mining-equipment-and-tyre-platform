import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [tyreList, setTyreList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    targetType: "Equipment",
    targetId: "",
    description: "",
    serviceDate: "",
    nextDueDate: "",
    cost: 0
  });

  const load = () => {
    api.get("/maintenance").then((res) => setRecords(res.data));
    api.get("/equipment").then((res) => setEquipmentList(res.data));
    api.get("/tyres").then((res) => setTyreList(res.data));
  };

  useEffect(load, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/maintenance", form);
    setForm({ targetType: "Equipment", targetId: "", description: "", serviceDate: "", nextDueDate: "", cost: 0 });
    setShowForm(false);
    load();
  };

  const targetOptions = form.targetType === "Equipment" ? equipmentList : tyreList;
  const isOverdue = (r) => r.nextDueDate && new Date(r.nextDueDate) < new Date();

  return (
    <div className="page">
      <div className="page-header">
        <h2>Maintenance Records</h2>
        <button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Log Maintenance"}</button>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleSubmit}>
          <select name="targetType" value={form.targetType} onChange={handleChange}>
            <option value="Equipment">Equipment</option>
            <option value="Tyre">Tyre</option>
          </select>
          <select name="targetId" value={form.targetId} onChange={handleChange} required>
            <option value="">Select {form.targetType}</option>
            {targetOptions.map((t) => (
              <option key={t._id} value={t._id}>{t.name || t.tyreCode}</option>
            ))}
          </select>
          <input name="description" placeholder="Description (e.g. Oil change)" value={form.description} onChange={handleChange} required />
          <input type="date" name="serviceDate" value={form.serviceDate} onChange={handleChange} required />
          <input type="date" name="nextDueDate" value={form.nextDueDate} onChange={handleChange} />
          <input type="number" name="cost" placeholder="Cost" value={form.cost} onChange={handleChange} />
          <button type="submit">Save</button>
        </form>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Target Type</th>
            <th>Description</th>
            <th>Service Date</th>
            <th>Next Due</th>
            <th>Performed By</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r._id} className={isOverdue(r) ? "overdue-row" : ""}>
              <td>{r.targetType}</td>
              <td>{r.description}</td>
              <td>{new Date(r.serviceDate).toLocaleDateString()}</td>
              <td>
                {r.nextDueDate ? new Date(r.nextDueDate).toLocaleDateString() : "-"}
                {isOverdue(r) && <span className="badge status-Replace-Soon">Overdue</span>}
              </td>
              <td>{r.performedBy?.name || "-"}</td>
              <td>₹{r.cost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
