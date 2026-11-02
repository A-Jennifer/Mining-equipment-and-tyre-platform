const Site = require("../models/Site");
const { asyncHandler, httpError } = require("../utils/http");

// Admin gets every site; managers and technicians only get their own.
exports.getSites = asyncHandler(async (req, res) => {
  if (req.user.role === "admin") return res.json(await Site.find().sort({ name: 1 }));
  if (!req.user.site) return res.json([]);
  res.json(await Site.find({ _id: req.user.site }));
});

exports.createSite = asyncHandler(async (req, res) => {
  res.status(201).json(await Site.create(req.body));
});

exports.updateSite = asyncHandler(async (req, res) => {
  const site = await Site.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!site) throw httpError(404, "Site not found");
  res.json(site);
});

exports.deleteSite = asyncHandler(async (req, res) => {
  const site = await Site.findByIdAndDelete(req.params.id);
  if (!site) throw httpError(404, "Site not found");
  res.json({ message: "Site deleted" });
});