const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const authorize = require("../middleware/role");
const { listUsers, listAssignable, createUser, updateUser, deleteUser } = require("../controllers/userController");

router.use(protect);

// technicians that a manager (or admin) can assign work to
router.get("/assignable", authorize("admin", "site_manager"), listAssignable);

// everything below: admin only (user management)
router.use(authorize("admin"));
router.get("/", listUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;