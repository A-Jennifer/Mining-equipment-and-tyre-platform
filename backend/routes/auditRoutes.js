const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const authorize = require("../middleware/role");
const AuditLog = require("../models/AuditLog");
const { asyncHandler } = require("../utils/http");

router.use(protect);

// GET /api/audit — admin only, last 200 entries
router.get(
  "/",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const logs = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json(logs);
  })
);

module.exports = router;
