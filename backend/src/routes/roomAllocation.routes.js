const express = require("express");

const {
  createRoomAllocation,
  getRoomAllocations,
  getRoomAllocationById,
  vacateRoom,
} = require("../controllers/roomAllocation.controller");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Get all room allocations
router.get(
  "/",
  authenticateToken,
  getRoomAllocations
);

// Get room allocation by ID
router.get(
  "/:id",
  authenticateToken,
  getRoomAllocationById
);

// Allocate a room - Admin and Warden
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  createRoomAllocation
);

// Vacate a room - Admin and Warden
router.put(
  "/:id/vacate",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  vacateRoom
);

module.exports = router;