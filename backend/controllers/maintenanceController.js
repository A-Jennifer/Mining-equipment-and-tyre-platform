const MaintenanceRecord = require("../models/MaintenanceRecord");
const Equipment = require("../models/Equipment");
const Tyre = require("../models/Tyre");
const AuditLog = require("../models/AuditLog");
const { getScope, maintenanceFilter, assertTechnician, idIn, sameId } = require("../utils/scope");
const { asyncHandler, httpError } = require("../utils/http");
const { getIO } = require("../utils/socket");

const withRefs = (query) =>
  query.populate("assignedTo", "name").populate("completedBy", "name").populate("targetId");

// Technicians do not see costs (including the cost of the tyre a job refers to).
const present = (record, user) => {
  const obj = record.toObject();
  if (user.role === "technician") {
    delete obj.cost;
    if (obj.targetId && typeof obj.targetId === "object") delete obj.targetId.cost;
  }
  return obj;
};

// The site an asset belongs to (equipment.site, or the site of the equipment a tyre is on).
async function siteOfTarget(targetType, targetId) {
  if (targetType === "Equipment") {
    const equipment = await Equipment.findById(targetId).select("site");
    return equipment?.site;
  }
  const tyre = await Tyre.findById(targetId).populate("equipment", "site");
  return tyre?.equipment?.site;
}

// Managers may only manage records for assets at their own site.
async function assertManageable(user, record) {
  if (user.role === "admin") return;
  const scope = await getScope(user);
  const list = record.targetType === "Equipment" ? scope.equipmentIds : scope.tyreIds;
  if (!idIn(list, record.targetId)) throw httpError(403, "That record belongs to another site");
}

exports.getRecords = asyncHandler(async (req, res) => {
  const scope = await getScope(req.user);
  const filter = maintenanceFilter(req.user, scope);
  const records = await withRefs(MaintenanceRecord.find(filter)).sort({ nextDueDate: 1, createdAt: -1 });
  res.json(records.map((r) => present(r, req.user)));
});

// POST (admin, site manager) -> create a work order and assign it to a technician
exports.createRecord = asyncHandler(async (req, res) => {
  const { targetType, targetId, description, nextDueDate, assignedTo, cost } = req.body;

  if (!["Equipment", "Tyre"].includes(targetType)) throw httpError(400, "Choose Equipment or Tyre");
  if (!targetId || !String(description || "").trim() || !nextDueDate || !assignedTo) {
    throw httpError(400, "Asset, title, due date and technician are required");
  }
  if (Number.isNaN(new Date(nextDueDate).getTime())) throw httpError(400, "Enter a valid due date");

  await assertManageable(req.user, { targetType, targetId });
  const siteId = await siteOfTarget(targetType, targetId);
  if (!siteId) throw httpError(400, "Asset not found");
  await assertTechnician(assignedTo, siteId);

  const record = await MaintenanceRecord.create({
    targetType,
    targetId,
    description: String(description).trim(),
    nextDueDate,
    assignedTo,
    cost,
    category: "Service",
    createdBy: req.user._id,
    status: "Open"
  });
  res.status(201).json(present(await withRefs(MaintenanceRecord.findById(record._id)), req.user));
});

// PUT /:id (admin, site manager) -> edit title / due date / cost, or reassign
exports.updateRecord = asyncHandler(async (req, res) => {
  const record = await MaintenanceRecord.findById(req.params.id);
  if (!record) throw httpError(404, "Record not found");
  await assertManageable(req.user, record);

  ["description", "nextDueDate", "cost"].forEach((field) => {
    if (req.body[field] !== undefined) record[field] = req.body[field];
  });
  if (req.body.assignedTo) {
    await assertTechnician(req.body.assignedTo, await siteOfTarget(record.targetType, record.targetId));
    record.assignedTo = req.body.assignedTo;
  }
  await record.save();
  res.json(present(await withRefs(MaintenanceRecord.findById(record._id)), req.user));
});

// PUT /:id/complete -> technician (own tasks only), site manager, admin
exports.completeRecord = asyncHandler(async (req, res) => {
  const record = await MaintenanceRecord.findById(req.params.id);
  if (!record) throw httpError(404, "Record not found");

  if (req.user.role === "technician") {
    if (!sameId(record.assignedTo, req.user._id)) throw httpError(403, "This task is not assigned to you");
  } else {
    await assertManageable(req.user, record);
  }
  if (record.status === "Completed") throw httpError(400, "This task is already completed");

  record.status = "Completed";
  record.completedAt = new Date();
  record.completedBy = req.user._id;
  record.note = String(req.body.note || "").trim();
  await record.save();

  // Finishing a tyre-replacement job closes the loop on the tyre itself.
  if (record.category === "Tyre replacement" && record.targetType === "Tyre") {
    const tyre = await Tyre.findById(record.targetId);
    if (tyre) {
      tyre.status = "Replaced";
      tyre.set("replacementRequest.status", "Completed");
      await tyre.save();
    }
  }

  // *** Audit + live push ***
  const detail = record.description || record._id.toString();
  try {
    await AuditLog.create({
      actor: req.user.name,
      actorId: req.user._id,
      role: req.user.role,
      action: "Job completed",
      detail,
      entity: "maintenance",
      entityId: record._id
    });
  } catch (e) { console.error("[audit]", e.message); }
  try {
    getIO().emit("notification", {
      action: "Job completed",
      detail,
      actor: req.user.name,
      role: req.user.role,
      at: new Date().toISOString()
    });
  } catch (e) { /* socket not ready */ }

  res.json(present(await withRefs(MaintenanceRecord.findById(record._id)), req.user));
});

exports.deleteRecord = asyncHandler(async (req, res) => {
  const record = await MaintenanceRecord.findByIdAndDelete(req.params.id);
  if (!record) throw httpError(404, "Record not found");
  res.json({ message: "Record deleted" });
});