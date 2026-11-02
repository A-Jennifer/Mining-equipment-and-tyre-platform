const Equipment = require("../models/Equipment");
const Tyre = require("../models/Tyre");
const { asyncHandler, httpError } = require("../utils/http");

// Managers and technicians may only touch equipment at their own site.
function assertSite(user, equipment) {
  if (user.role === "admin") return;
  const siteId = equipment.site?._id || equipment.site;
  if (!user.site || !siteId || String(siteId) !== String(user.site)) {
    throw httpError(403, "This equipment belongs to another site");
  }
}

async function findOwned(req) {
  const item = await Equipment.findById(req.params.id).populate("site", "name location");
  if (!item) throw httpError(404, "Equipment not found");
  assertSite(req.user, item);
  return item;
}

exports.getEquipment = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.user.role === "admin") {
    if (req.query.site) filter.site = req.query.site;
  } else {
    if (!req.user.site) return res.json([]);
    filter.site = req.user.site;
  }
  res.json(await Equipment.find(filter).populate("site", "name location").sort({ name: 1 }));
});

exports.getEquipmentById = asyncHandler(async (req, res) => res.json(await findOwned(req)));

// GET /api/equipment/qr/:qrCode -> used by the QR lookup
exports.getEquipmentByQr = asyncHandler(async (req, res) => {
  const item = await Equipment.findOne({ qrCode: req.params.qrCode }).populate("site", "name location");
  if (!item) throw httpError(404, "No equipment found for this QR code");
  assertSite(req.user, item);
  res.json(item);
});

// POST (admin, site manager). Managers can only create equipment at their own site.
exports.createEquipment = asyncHandler(async (req, res) => {
  const site = req.user.role === "admin" ? req.body.site : req.user.site;
  if (!site) throw httpError(400, "Site is required");

  const { name, model, type, status, purchaseDate, totalUsageHours } = req.body;
  const item = await Equipment.create({ name, model, type, status, purchaseDate, totalUsageHours, site });
  res.status(201).json(item);
});

// PUT (admin, site manager)
exports.updateEquipment = asyncHandler(async (req, res) => {
  const item = await findOwned(req);
  ["name", "model", "type", "status", "purchaseDate", "totalUsageHours"].forEach((field) => {
    if (req.body[field] !== undefined) item[field] = req.body[field];
  });
  if (req.user.role === "admin" && req.body.site) item.site = req.body.site;
  await item.save();
  res.json(item);
});

// PATCH /:id/usage (all roles) -> log the latest hour-meter reading
exports.updateUsage = asyncHandler(async (req, res) => {
  const item = await findOwned(req);
  const hours = Number(req.body.totalUsageHours);
  if (!Number.isFinite(hours) || hours < 0) throw httpError(400, "Enter a valid number of hours");
  if (hours < item.totalUsageHours) {
    throw httpError(400, `Hour meter cannot go backwards (currently ${item.totalUsageHours} hrs)`);
  }
  item.totalUsageHours = hours;
  await item.save();
  res.json(item);
});

exports.deleteEquipment = asyncHandler(async (req, res) => {
  const item = await Equipment.findByIdAndDelete(req.params.id);
  if (!item) throw httpError(404, "Equipment not found");
  await Tyre.deleteMany({ equipment: item._id }); // remove its tyres too
  res.json({ message: "Equipment deleted" });
});