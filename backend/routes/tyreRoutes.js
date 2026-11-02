const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const authorize = require("../middleware/role");
const {
  getTyres, getTyreById, getTyreByQr, createTyre, updateTyre, updateUsage,
  requestReplacement, reviewRequest, deleteTyre
} = require("../controllers/tyreController");

router.use(protect);

router.get("/", getTyres);
router.get("/qr/:qrCode", getTyreByQr);
router.get("/:id", getTyreById);
router.patch("/:id/usage", updateUsage); // all roles: log tyre hours

router.post("/:id/request-replacement", authorize("technician"), requestReplacement);
router.put("/:id/review-request", authorize("admin", "site_manager"), reviewRequest);

router.post("/", authorize("admin", "site_manager"), createTyre);
router.put("/:id", authorize("admin", "site_manager"), updateTyre);
router.delete("/:id", authorize("admin"), deleteTyre);

module.exports = router;