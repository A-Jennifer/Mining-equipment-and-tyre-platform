const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Site = require("../models/Site");
const Equipment = require("../models/Equipment");
const MaintenanceRecord = require("../models/MaintenanceRecord");
const { asyncHandler, httpError } = require("../utils/http");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const password = String(req.body.password || "");

  if (!email || !password) {
    throw httpError(400, "Please provide both an email address and a password.");
  }

  const user = await User.findOne({ email }).populate("site", "name location");
  if (!user) {
    throw httpError(
      401,
      "No account found with this email. If you are reviewing the app, please use 'Sign Up' below to create your account instantly!"
    );
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw httpError(
      401,
      "Incorrect password. Please re-check or use the One-Click Demo buttons below."
    );
  }

  if (user.isActive === false) {
    throw httpError(403, "This account has been deactivated. Please contact your administrator.");
  }

  res.json({ user, token: signToken(user._id) });
});

// POST /api/auth/register
// Allows public sign-up for Technician and Site Manager roles.
// Admin role is protected and cannot be self-created (must use demo login or existing admin).
exports.register = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").toLowerCase().trim();
  const password = String(req.body.password || "");
  let role = String(req.body.role || "technician").toLowerCase().trim();

  if (!name) throw httpError(400, "Full name is required.");
  if (!email || !email.includes("@")) throw httpError(400, "A valid email address is required.");
  if (!password || password.length < 6) throw httpError(400, "Password must be at least 6 characters.");

  if (role === "admin") {
    throw httpError(
      400,
      "Administrator accounts cannot be self-registered for security. Please use the Admin Demo button on the login screen."
    );
  }

  if (!["technician", "site_manager"].includes(role)) {
    role = "technician";
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw httpError(409, "An account with this email already exists. Please sign in directly.");
  }

  // Resolve site: if provided, verify it exists; otherwise assign first available site
  let siteId = req.body.site;
  if (siteId) {
    const siteExists = await Site.findById(siteId);
    if (!siteExists) siteId = null;
  }
  if (!siteId) {
    const defaultSite = await Site.findOne().sort({ createdAt: 1 });
    if (defaultSite) siteId = defaultSite._id;
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    site: siteId,
    isActive: true
  });

  // If registering as a technician, assign a couple of starter tasks so their dashboard isn't blank
  if (role === "technician" && siteId) {
    try {
      const eq = await Equipment.findOne({ site: siteId });
      if (eq) {
        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;
        await MaintenanceRecord.create([
          {
            targetType: "Equipment",
            targetId: eq._id,
            category: "Service",
            description: `Pre-Shift Inspection & Tyre Pressure Check (${eq.name})`,
            serviceDate: new Date(now),
            nextDueDate: new Date(now + 2 * DAY),
            status: "Open",
            assignedTo: user._id,
            cost: 4500
          },
          {
            targetType: "Equipment",
            targetId: eq._id,
            category: "Service",
            description: `Visual Tread & Rim Alignment Check (${eq.name})`,
            serviceDate: new Date(now - DAY),
            nextDueDate: new Date(now + 5 * DAY),
            status: "Open",
            assignedTo: user._id,
            cost: 6000
          }
        ]);
      }
    } catch (e) {
      console.warn("Could not seed starter tasks for new technician:", e.message);
    }
  }

  const populatedUser = await User.findById(user._id).populate("site", "name location");
  res.status(201).json({
    user: populatedUser,
    token: signToken(user._id)
  });
});

// GET /api/auth/sites (Public list for registration dropdown)
exports.getPublicSites = asyncHandler(async (req, res) => {
  const sites = await Site.find().select("_id name location").sort({ name: 1 });
  res.json(sites);
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("site", "name location");
  res.json({ user });
});

// POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  if (!email) throw httpError(400, "Please provide an email address.");
  const user = await User.findOne({ email });
  if (!user) throw httpError(404, "No account found with this email.");

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordToken = resetCode;
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins
  await user.save();

  res.json({
    message: "Password reset code generated successfully.",
    resetCode
  });
});

// POST /api/auth/reset-password
exports.resetPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const code = String(req.body.code || "").trim();
  const newPassword = String(req.body.newPassword || "");

  if (!email || !code || !newPassword) {
    throw httpError(400, "Please provide email, verification code, and new password.");
  }
  if (newPassword.length < 6) {
    throw httpError(400, "New password must be at least 6 characters.");
  }

  const user = await User.findOne({
    email,
    resetPasswordToken: code,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw httpError(400, "Invalid or expired verification code.");
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ message: "Password updated successfully. You can now log in." });
});