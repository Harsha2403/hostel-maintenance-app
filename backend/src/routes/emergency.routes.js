const express = require("express");

const {
  createEmergency,
  getMyEmergencies,
  getEmergencies,
  getEmergencyById,
  updateEmergencyStatus,
} = require("../controllers/emergency.controller");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// ============================================================
// STUDENT
// ============================================================

router.post(
  "/",
  authenticateToken,
  authorizeRoles("STUDENT"),
  createEmergency
);

router.get(
  "/my-emergencies",
  authenticateToken,
  authorizeRoles("STUDENT"),
  getMyEmergencies
);

// ============================================================
// ADMIN / WARDEN
// ============================================================

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  getEmergencies
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  getEmergencyById
);

router.put(
  "/:id/status",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  updateEmergencyStatus
);

module.exports = router;