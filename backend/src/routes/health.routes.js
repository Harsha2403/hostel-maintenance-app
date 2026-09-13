const express = require("express");

const {
  createHealthRequest,
  getMyHealthRequests,
  getHealthRequests,
  getHealthRequestById,
  updateHealthRequestStatus,
} = require("../controllers/health.controller");

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
  createHealthRequest
);

router.get(
  "/my-requests",
  authenticateToken,
  authorizeRoles("STUDENT"),
  getMyHealthRequests
);

// ============================================================
// ADMIN / WARDEN
// ============================================================

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  getHealthRequests
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  getHealthRequestById
);

router.put(
  "/:id/status",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  updateHealthRequestStatus
);

module.exports = router;