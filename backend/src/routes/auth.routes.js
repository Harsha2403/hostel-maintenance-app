const express = require("express");

const {
  login,
  studentRegister,
  createMaintenanceStaff,
  getMaintenanceStaff,
  updateMaintenanceStaffStatus,
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
// STUDENT SELF REGISTRATION
// PUBLIC
// ==========================================

router.post(
  "/student-register",
  studentRegister
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
//
// Default:
//   only active staff
//
// With:
//   ?includeInactive=true
//
// Returns:
//   active + inactive staff
// ==========================================

router.get(
  "/maintenance-staff",
  authenticateToken,
  requireAdmin,
  getMaintenanceStaff
);

// ==========================================
// ACTIVATE / DEACTIVATE
// MAINTENANCE STAFF
// ADMIN ONLY
// ==========================================

router.patch(
  "/maintenance-staff/:id/status",
  authenticateToken,
  requireAdmin,
  updateMaintenanceStaffStatus
);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;