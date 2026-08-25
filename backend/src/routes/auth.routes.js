const express = require("express");

const {
  login,
  createMaintenanceStaff,
} = require("../controllers/auth.controller");

const router = express.Router();

// Login
router.post("/login", login);

// Create Maintenance Staff
router.post("/maintenance-staff", createMaintenanceStaff);

module.exports = router;