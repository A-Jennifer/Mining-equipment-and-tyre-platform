const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const authorize = require("../middleware/role");
const { getRecords, createRecord, updateRecord, completeRecord, deleteRecord } = require("../controllers/maintenanceController");

router.use(protect);

router.get("/", getRecords); // each role only gets the records it is allowed to see
router.post("/", authorize("admin", "site_manager"), createRecord); // assign a job
router.put("/:id/complete", completeRecord); // technician (own jobs), manager, admin
router.put("/:id", authorize("admin", "site_manager"), updateRecord);
router.delete("/:id", authorize("admin"), deleteRecord);

module.exports = router;