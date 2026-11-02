const Equipment = require("../models/Equipment");
const Tyre = require("../models/Tyre");
const MaintenanceRecord = require("../models/MaintenanceRecord");

// GET /api/dashboard/summary
exports.getSummary = async (req, res) => {
  const [totalEquipment, equipmentUnderRepair, totalTyres, tyresReplaceSoon, overdueCount] =
    await Promise.all([
      Equipment.countDocuments(),
      Equipment.countDocuments({ status: "Under Repair" }),
      Tyre.countDocuments(),
      Tyre.countDocuments({ status: "Replace Soon" }),
      MaintenanceRecord.countDocuments({ nextDueDate: { $lt: new Date() } })
    ]);

  res.json({
    totalEquipment,
    equipmentUnderRepair,
    totalTyres,
    tyresReplaceSoon,
    overdueMaintenance: overdueCount
  });
};

// GET /api/dashboard/tyre-status-distribution -> for pie/bar chart
exports.getTyreStatusDistribution = async (req, res) => {
  const distribution = await Tyre.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);
  res.json(distribution.map((d) => ({ status: d._id, count: d.count })));
};

// GET /api/dashboard/cost-by-brand -> for bar chart
exports.getCostByBrand = async (req, res) => {
  const result = await Tyre.aggregate([
    { $group: { _id: "$brand", totalCost: { $sum: "$cost" }, avgUsageHours: { $avg: "$usageHours" } } },
    { $sort: { totalCost: -1 } }
  ]);
  res.json(result.map((r) => ({ brand: r._id, totalCost: r.totalCost, avgUsageHours: Math.round(r.avgUsageHours) })));
};

// GET /api/dashboard/equipment-status -> for equipment status chart
exports.getEquipmentStatusDistribution = async (req, res) => {
  const distribution = await Equipment.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);
  res.json(distribution.map((d) => ({ status: d._id, count: d.count })));
};
