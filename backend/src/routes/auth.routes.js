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
// LOGIN
// ==========================================

router.post(
  "/login",
  login
);


// ==========================================
// ADMIN AUTHORIZATION
// ==========================================

const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Only administrators can manage maintenance staff",
      });
    }

    next();
  } catch (error) {
    console.error(
      "Admin authorization error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Authorization error",
    });
  }
};


// ==========================================
// CREATE MAINTENANCE STAFF
// ADMIN ONLY
// ==========================================

router.post(
  "/maintenance-staff",
  authenticateToken,
  requireAdmin,
  createMaintenanceStaff
);


// ==========================================
// GET ALL MAINTENANCE STAFF
// ADMIN ONLY
// ==========================================

router.get(
  "/maintenance-staff",
  authenticateToken,
  requireAdmin,
  getMaintenanceStaff
);


module.exports = router;
