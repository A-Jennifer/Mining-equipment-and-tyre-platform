const Tyre = require("../models/Tyre");
const Equipment = require("../models/Equipment");
const MaintenanceRecord = require("../models/MaintenanceRecord");
const AuditLog = require("../models/AuditLog");
const { getScope, assertTechnician, idIn } = require("../utils/scope");
const { asyncHandler, httpError } = require("../utils/http");
const { getIO } = require("../utils/socket");

const withRefs = (query) =>
  query.populate("equipment", "name type site").populate("replacementRequest.requestedBy", "name");

// Technicians never see purchase cost.
const present = (tyre, user) => {
  const obj = tyre.toObject();
  if (user.role === "technician") delete obj.cost;
  return obj;
};

// Managers and technicians may only touch tyres on equipment at their own site.
function assertInSite(user, tyre) {
  if (user.role === "admin") return;
  const siteId = tyre.equipment?.site;
  if (!user.site || !siteId || String(siteId) !== String(user.site)) {
    throw httpError(403, "This tyre belongs to another site");
  }
}

async function findOwned(req) {
  const tyre = await withRefs(Tyre.findById(req.params.id));
  if (!tyre) throw httpError(404, "Tyre not found");
  assertInSite(req.user, tyre);
  return tyre;
}

const respond = async (req, res, id, status = 200) => {
  const fresh = await withRefs(Tyre.findById(id));
  res.status(status).json(present(fresh, req.user));
};

// Helper: fire-and-forget audit log + socket event
async function audit(req, action, tyre, extra = {}) {
  const siteName = tyre.equipment?.site?.name || req.user?.site || "";
  const detail = `${tyre.tyreCode} · ${tyre.brand}`;

  try {
    await AuditLog.create({
      actor: req.user.name,
      actorId: req.user._id,
      role: req.user.role,
      action,
      detail,
      entity: "tyre",
      entityId: tyre._id,
      site: siteName,
      ...extra
    });
  } catch (e) {
    console.error("[audit] could not write log:", e.message);
  }

  try {
    getIO().emit("notification", {
      action,
      detail,
      actor: req.user.name,
      role: req.user.role,
      site: siteName,
      at: new Date().toISOString()
    });
  } catch (e) {
    // socket not ready (tests / seed) — silently skip
  }
}

exports.getTyres = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  if (req.user.role === "admin") {
    if (req.query.equipment) filter.equipment = req.query.equipment;
  } else {
    const scope = await getScope(req.user);
    filter.equipment =
      req.query.equipment && idIn(scope.equipmentIds, req.query.equipment)
        ? req.query.equipment
        : { $in: scope.equipmentIds };
  }

  const tyres = await withRefs(Tyre.find(filter)).sort({ createdAt: -1 });
  res.json(tyres.map((t) => present(t, req.user)));
});

exports.getTyreById = asyncHandler(async (req, res) => {
  const tyre = await findOwned(req);
  res.json(present(tyre, req.user));
});

// GET /api/tyres/qr/:qrCode -> used by the QR lookup
exports.getTyreByQr = asyncHandler(async (req, res) => {
  const tyre = await withRefs(Tyre.findOne({ qrCode: req.params.qrCode }));
  if (!tyre) throw httpError(404, "No tyre found for this QR code");
  assertInSite(req.user, tyre);
  res.json(present(tyre, req.user));
});

// POST (admin, site manager)
exports.createTyre = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findById(req.body.equipment);
  if (!equipment) throw httpError(400, "Choose the equipment this tyre is mounted on");
  if (req.user.role !== "admin" && String(equipment.site) !== String(req.user.site)) {
    throw httpError(403, "That equipment belongs to another site");
  }

  const { brand, size, position, usageHours, wearThresholdHours, cost } = req.body;
  const tyre = await Tyre.create({ brand, size, position, usageHours, wearThresholdHours, cost, equipment: equipment._id });
  await respond(req, res, tyre._id, 201);
});

// PUT (admin, site manager)
exports.updateTyre = asyncHandler(async (req, res) => {
  const tyre = await findOwned(req);
  ["brand", "size", "position", "usageHours", "wearThresholdHours", "cost"].forEach((field) => {
    if (req.body[field] !== undefined) tyre.set(field, req.body[field]);
  });
  await tyre.save(); // pre-save hook recalculates status
  await respond(req, res, tyre._id);
});

// PATCH /:id/usage (all roles) -> log the latest tyre hours
exports.updateUsage = asyncHandler(async (req, res) => {
  const tyre = await findOwned(req);
  const hours = Number(req.body.usageHours);
  if (!Number.isFinite(hours) || hours < 0) throw httpError(400, "Enter a valid number of hours");
  if (hours < tyre.usageHours) throw httpError(400, `Tyre hours cannot go backwards (currently ${tyre.usageHours} hrs)`);

  tyre.usageHours = hours;
  await tyre.save(); // status is recalculated automatically
  await respond(req, res, tyre._id);
});

// POST /:id/request-replacement (technician) — emits socket + audit
exports.requestReplacement = asyncHandler(async (req, res) => {
  const tyre = await findOwned(req);
  const reason = String(req.body.reason || "").trim();
  const current = tyre.get("replacementRequest.status");

  if (reason.length < 3) throw httpError(400, "Please give a short reason for the request");
  if (tyre.status === "Replaced") throw httpError(400, "This tyre has already been replaced");
  if (current === "Pending" || current === "Approved") throw httpError(400, "A replacement request is already open for this tyre");

  tyre.set("replacementRequest", {
    status: "Pending",
    requestedBy: req.user._id,
    requestedAt: new Date(),
    reason
  });
  await tyre.save();

  // *** Audit + live push ***
  await audit(req, "Request raised", tyre);

  await respond(req, res, tyre._id);
});

// PUT /:id/review-request (admin, site manager) — emits socket + audit
exports.reviewRequest = asyncHandler(async (req, res) => {
  const tyre = await findOwned(req);
  const { decision, note, assignedTo, dueDate } = req.body;

  if (tyre.get("replacementRequest.status") !== "Pending") throw httpError(400, "There is no pending request for this tyre");
  if (!["Approved", "Rejected"].includes(decision)) throw httpError(400, "Decision must be Approved or Rejected");

  let task;
  if (decision === "Approved") {
    if (!assignedTo || !dueDate) throw httpError(400, "Choose a technician and a due date to approve");
    if (Number.isNaN(new Date(dueDate).getTime())) throw httpError(400, "Enter a valid due date");
    await assertTechnician(assignedTo, tyre.equipment?.site);

    task = await MaintenanceRecord.create({
      targetType: "Tyre",
      targetId: tyre._id,
      category: "Tyre replacement",
      description: `Replace tyre ${tyre.tyreCode}`,
      nextDueDate: dueDate,
      assignedTo,
      createdBy: req.user._id,
      status: "Open"
    });
  }

  tyre.set({
    "replacementRequest.status": decision,
    "replacementRequest.reviewedBy": req.user._id,
    "replacementRequest.reviewedAt": new Date(),
    "replacementRequest.reviewNote": String(note || "").trim(),
    "replacementRequest.task": task ? task._id : undefined
  });
  await tyre.save();

  // *** Audit + live push ***
  const action = decision === "Approved" ? "Request approved · Job assigned" : "Request rejected";
  await audit(req, action, tyre);

  await respond(req, res, tyre._id);
});

exports.deleteTyre = asyncHandler(async (req, res) => {
  const tyre = await Tyre.findByIdAndDelete(req.params.id);
  if (!tyre) throw httpError(404, "Tyre not found");
  res.json({ message: "Tyre deleted" });
});