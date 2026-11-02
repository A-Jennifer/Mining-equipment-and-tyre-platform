const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const authorize = require("../middleware/role");
const {
  getSites,
  createSite,
  updateSite,
  deleteSite
} = require("../controllers/siteController");

router.use(protect);

router.get("/", getSites);
router.post("/", authorize("admin"), createSite);
router.put("/:id", authorize("admin"), updateSite);
router.delete("/:id", authorize("admin"), deleteSite);

module.exports = router;
