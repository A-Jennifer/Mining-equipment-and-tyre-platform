import haulTruck from "../assets/haul-truck.jpg";
import excavatorImg from "../assets/excavator.jpg";

export const currency = (value) => (value === null || value === undefined ? "—" : `₹${Number(value).toLocaleString("en-IN")}`);

export const fmtDate = (iso, long) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: long ? "long" : "short", year: "numeric" });

export const equipmentImage = (type) => (type === "Excavator" ? excavatorImg : haulTruck);

/* ---------- Adapters: MongoDB document  ->  shape the UI uses ---------- */

export function adaptEquipment(e) {
  return {
    kind: "equipment",
    _id: e._id,
    id: e.qrCode, // the QR code doubles as the public asset ID
    name: e.name,
    model: e.model || e.type,
    type: e.type,
    site: e.site?.name || "Unassigned",
    hours: e.totalUsageHours || 0,
    status: e.status, // Active | Under Repair | Idle
    image: equipmentImage(e.type)
  };
}

export function adaptTyre(t, siteByEquipmentId) {
  const equipmentId = t.equipment?._id;
  const rr = t.replacementRequest || {};
  return {
    kind: "tyre",
    _id: t._id,
    id: t.qrCode,
    brand: t.brand,
    size: t.size || "",
    equipment: t.equipment?.name || "Unmounted",
    position: t.position,
    hours: t.usageHours || 0,
    threshold: t.wearThresholdHours || 1,
    cost: t.cost === undefined ? null : t.cost, // technicians do not receive costs
    status: t.status, // Good | Monitor | Replace Soon | Replaced  (from backend logic)
    site: siteByEquipmentId[equipmentId] || "Unassigned",
    request: {
      status: rr.status || "None", // None | Pending | Approved | Rejected | Completed
      reason: rr.reason || "",
      by: rr.requestedBy?.name || "",
      at: rr.requestedAt || null,
      note: rr.reviewNote || ""
    }
  };
}

export function adaptService(m, siteByEquipmentId) {
  const target = m.targetId; // populated Equipment or Tyre document (or null if deleted)
  const equipmentId = m.targetType === "Tyre" ? target?.equipment : target?._id;
  const due = m.nextDueDate ? new Date(m.nextDueDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const done = m.status ? m.status === "Completed" : !m.nextDueDate;
  let status = "Completed";
  if (!done) status = due && due < today ? "Overdue" : "Upcoming";

  return {
    kind: "service",
    _id: m._id,
    id: `SV-${String(m._id).slice(-4).toUpperCase()}`,
    title: m.description,
    targetType: m.targetType,
    category: m.category || "Service",
    equipment: target ? target.name || `${target.brand} (${target.qrCode})` : "Deleted asset",
    assignedTo: m.assignedTo?.name || "Unassigned",
    date: String(m.nextDueDate || m.serviceDate).slice(0, 10),
    completedAt: m.completedAt ? String(m.completedAt).slice(0, 10) : "",
    note: m.note || "",
    site: siteByEquipmentId[equipmentId] || "Unassigned",
    status
  };
}

export function adaptUser(u) {
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    site: u.site?.name || "",
    siteId: u.site?._id || "",
    isActive: u.isActive !== false
  };
}

/* ---------- Status helpers ---------- */

export const statusClass = (status) => {
  if (["Replace Soon", "Overdue", "Under Repair"].includes(status)) return "critical";
  if (["Monitor", "Upcoming", "Idle"].includes(status)) return "monitor";
  if (status === "Replaced") return "neutral";
  return "good"; // Good, Active, Completed
};

/* ---------- Health score + remaining life (weighted formula) ----------
   Load, terrain, temperature and daily hours are SIMULATED per tyre here
   (derived from its ID). In a real deployment they would come from
   telematics / IoT sensors. The formula itself is the real logic.        */

const seed = (id) => [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

export function tyreFactors(t) {
  const s = seed(t.id);
  return {
    dailyHours: 14 + (s % 7), // average running hours per day
    load: [0.75, 0.9, 1.05][s % 3], // payload ratio vs rated load
    terrain: ["Haul road", "Mixed", "Rocky pit"][s % 3],
    temp: 58 + (s % 25) // average operating temperature, °C
  };
}

export function tyreHealth(t) {
  const f = tyreFactors(t);
  const loadW = Math.max(0, f.load - 0.8) * 0.25;
  const terrainW = f.terrain === "Rocky pit" ? 0.06 : f.terrain === "Mixed" ? 0.03 : 0;
  const tempW = Math.max(0, f.temp - 70) * 0.004;
  const stress = 1 + loadW + terrainW + tempW; // >1 means the tyre wears faster than normal

  const wear = t.hours / t.threshold;
  const score = Math.max(0, Math.min(100, Math.round(100 * (1 - wear * stress))));
  const remainingHours = Math.max(0, t.threshold / stress - t.hours);
  const daysLeft = Math.round(remainingHours / f.dailyHours);

  return { score, daysLeft, stress, ...f };
}

export const healthTone = (score) => (score < 20 ? "critical" : score < 45 ? "monitor" : "good");