const Equipment = require("../models/Equipment");
const Tyre = require("../models/Tyre");
const User = require("../models/User");
const { httpError } = require("./http");

const sameId = (a, b) => String(a) === String(b);
const idIn = (list, id) => list.some((x) => sameId(x, id));

// Admin sees everything. Site managers and technicians are locked to their own site.
async function getScope(user) {
  if (user.role === "admin") return { all: true, equipmentIds: [], tyreIds: [] };
  if (!user.site) return { all: false, equipmentIds: [], tyreIds: [] }; // no site -> sees nothing

  const equipment = await Equipment.find({ site: user.site }).select("_id");
  const equipmentIds = equipment.map((e) => e._id);
  const tyres = await Tyre.find({ equipment: { $in: equipmentIds } }).select("_id");
  return { all: false, equipmentIds, tyreIds: tyres.map((t) => t._id) };
}

// MongoDB filter for the maintenance records this user may see.
//  admin       -> everything
//  manager     -> records for assets at their site
//  technician  -> only the records assigned to them (at their site)
function maintenanceFilter(user, scope) {
  if (scope.all) return {};
  const inSite = {
    $or: [
      { targetType: "Equipment", targetId: { $in: scope.equipmentIds } },
      { targetType: "Tyre", targetId: { $in: scope.tyreIds } }
    ]
  };
  return user.role === "technician" ? { $and: [inSite, { assignedTo: user._id }] } : inSite;
}

// The chosen assignee must be an active technician working at the given site.
async function assertTechnician(technicianId, siteId) {
  const tech = await User.findById(technicianId);
  if (!tech || tech.role !== "technician" || tech.isActive === false) {
    throw httpError(400, "Selected technician is not available");
  }
  if (!siteId || !sameId(tech.site, siteId)) {
    throw httpError(400, "That technician works at a different site");
  }
  return tech;
}

module.exports = { getScope, maintenanceFilter, assertTechnician, sameId, idIn };