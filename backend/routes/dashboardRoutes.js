const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const authorize = require("../middleware/role");
const {
  getSummary, getTyreStatusDistribution, getCostByBrand, getEquipmentStatusDistribution
} = require("../controllers/dashboardController");

router.use(protect, authorize("admin")); // company-wide numbers: admin only

router.get("/summary", getSummary);
router.get("/tyre-status-distribution", getTyreStatusDistribution);
router.get("/cost-by-brand", getCostByBrand);
router.get("/equipment-status", getEquipmentStatusDistribution);

module.exports = router;