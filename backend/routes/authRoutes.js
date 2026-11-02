const express = require("express");
const router = express.Router();
const { login, register, getPublicSites, getMe, forgotPassword, resetPassword } = require("../controllers/authController");
const protect = require("../middleware/auth");

router.post("/login", login);
router.post("/register", register);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/sites", getPublicSites);
router.get("/me", protect, getMe);

module.exports = router;