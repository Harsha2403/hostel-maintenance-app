const express = require("express");

const {
  login,
  createMaintenanceStaff,
  getMaintenanceStaff,
} = require("../controllers/auth.controller");

const {
  authenticateToken,
} = require("../middleware/auth.middleware");

const router = express.Router();


// ==========================================
// Login
// ==========================================

router.post("/login", login);


// ==========================================
// Create Maintenance Staff
// ==========================================

router.post(
  "/maintenance-staff",
  authenticateToken,
  createMaintenanceStaff
);


// ==========================================
// Get All Maintenance Staff
// ==========================================

router.get(
  "/maintenance-staff",
  authenticateToken,
  getMaintenanceStaff
);


module.exports = router;