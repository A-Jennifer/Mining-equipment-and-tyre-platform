const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const authorize = require("../middleware/role");
const {
  getEquipment, getEquipmentById, getEquipmentByQr, createEquipment, updateEquipment, updateUsage, deleteEquipment
} = require("../controllers/equipmentController");

router.use(protect);

router.get("/", getEquipment);
router.get("/qr/:qrCode", getEquipmentByQr);
router.get("/:id", getEquipmentById);
router.patch("/:id/usage", updateUsage); // all roles: log hour-meter readings

router.post("/", authorize("admin", "site_manager"), createEquipment);
router.put("/:id", authorize("admin", "site_manager"), updateEquipment);
router.delete("/:id", authorize("admin"), deleteEquipment);

module.exports = router;