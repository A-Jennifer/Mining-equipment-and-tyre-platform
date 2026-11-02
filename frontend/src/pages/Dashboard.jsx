import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { MiningTruckIllustration } from "../components/illustrations";

const STATUS_COLORS = {
  Good: "#16a34a",
  Monitor: "#d97706",
  "Replace Soon": "#dc2626",
  Replaced: "#9ca3af",
  Active: "#16a34a",
  "Under Repair": "#dc2626",
  Idle: "#9ca3af"
};

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [tyreStatus, setTyreStatus] = useState([]);
  const [costByBrand, setCostByBrand] = useState([]);
  const [equipmentStatus, setEquipmentStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/summary"),
      api.get("/dashboard/tyre-status-distribution"),
      api.get("/dashboard/cost-by-brand"),
      api.get("/dashboard/equipment-status")
    ])
      .then(([s, t, c, e]) => {
        setSummary(s.data);
        setTyreStatus(t.data);
        setCostByBrand(c.data);
        setEquipmentStatus(e.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 30 }}>Loading dashboard...</p>;

  return (
    <div className="page">
      <div className="hero-banner">
        <div className="hero-text">
          <h1>Welcome back, {user.name.split(" ")[0]} 👋</h1>
          <p>Here's a live snapshot of equipment health, tyre wear, and maintenance status across your mine site.</p>
        </div>
        <div className="hero-illustration">
          <MiningTruckIllustration width={200} />
        </div>
      </div>

      <div className="card-grid">
        <SummaryCard label="Total Equipment" value={summary.totalEquipment} />
        <SummaryCard label="Equipment Under Repair" value={summary.equipmentUnderRepair} warn />
        <SummaryCard label="Total Tyres" value={summary.totalTyres} />
        <SummaryCard label="Tyres: Replace Soon" value={summary.tyresReplaceSoon} warn />
        <SummaryCard label="Overdue Maintenance" value={summary.overdueMaintenance} warn />
      </div>

      <div className="chart-grid">
        <div className="chart-box">
          <h3>Tyre Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={tyreStatus} dataKey="count" nameKey="status" outerRadius={90} label>
                {tyreStatus.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] || "#8884d8"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h3>Equipment Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={equipmentStatus} dataKey="count" nameKey="status" outerRadius={90} label>
                {equipmentStatus.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] || "#8884d8"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box wide">
          <h3>Tyre Replacement Cost by Brand</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={costByBrand}>
              <XAxis dataKey="brand" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalCost" fill="#4f46e5" name="Total Cost (₹)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, warn }) {
  return (
    <div className={`summary-card ${warn && value > 0 ? "warn" : ""}`}>
      <div className="summary-value">{value}</div>
      <div className="summary-label">{label}</div>
    </div>
  );
}