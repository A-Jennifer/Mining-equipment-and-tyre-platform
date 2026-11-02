const User = require("../models/User");
const Site = require("../models/Site");
const { asyncHandler, httpError } = require("../utils/http");
const { sameId } = require("../utils/scope");

const ROLES = ["admin", "site_manager", "technician"];

// Managers and technicians must belong to a site; admins are not tied to one.
async function resolveSite(role, site) {
  if (role === "admin") return undefined;
  if (!site) throw httpError(400, "Site is required for site managers and technicians");
  if (!(await Site.exists({ _id: site }))) throw httpError(400, "Selected site does not exist");
  return site;
}

// GET /api/users            (admin)
exports.listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate("site", "name").sort({ role: 1, name: 1 });
  res.json(users);
});

// GET /api/users/assignable (admin, site manager) -> technicians who can be given work
exports.listAssignable = asyncHandler(async (req, res) => {
  const filter = { role: "technician", isActive: { $ne: false } };
  if (req.user.role !== "admin") {
    if (!req.user.site) return res.json([]);
    filter.site = req.user.site;
  }
  res.json(await User.find(filter).populate("site", "name").sort({ name: 1 }));
});

// POST /api/users           (admin)
exports.createUser = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").toLowerCase().trim();
  const password = String(req.body.password || "");
  const role = req.body.role;

  if (!name || !email || !password) throw httpError(400, "Name, email and password are required");
  if (password.length < 6) throw httpError(400, "Password must be at least 6 characters");
  if (!ROLES.includes(role)) throw httpError(400, "Choose a valid role");
  if (await User.findOne({ email })) throw httpError(409, "A user with this email already exists");

  const site = await resolveSite(role, req.body.site);
  const user = await User.create({ name, email, password, role, site });
  res.status(201).json(await User.findById(user._id).populate("site", "name"));
});

// PUT /api/users/:id        (admin)
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, "User not found");

  const { name, role, isActive, password } = req.body;
  const isSelf = sameId(user._id, req.user._id);

  if (isSelf && ((role !== undefined && role !== user.role) || isActive === false)) {
    throw httpError(400, "You cannot change your own role or deactivate your own account");
  }

  if (name !== undefined && String(name).trim()) user.name = String(name).trim();
  if (role !== undefined) {
    if (!ROLES.includes(role)) throw httpError(400, "Choose a valid role");
    user.role = role;
  }
  if (isActive !== undefined) user.isActive = Boolean(isActive);
  if (role !== undefined || req.body.site !== undefined) {
    user.site = await resolveSite(user.role, req.body.site !== undefined ? req.body.site : user.site);
  }
  if (password) {
    if (String(password).length < 6) throw httpError(400, "Password must be at least 6 characters");
    user.password = String(password);
  }

  await user.save();
  res.json(await User.findById(user._id).populate("site", "name"));
});

// DELETE /api/users/:id     (admin)
exports.deleteUser = asyncHandler(async (req, res) => {
  if (sameId(req.params.id, req.user._id)) throw httpError(400, "You cannot delete your own account");
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw httpError(404, "User not found");
  res.json({ message: "User deleted" });
});