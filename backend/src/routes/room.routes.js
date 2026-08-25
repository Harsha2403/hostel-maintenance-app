const express = require("express");

const {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
} = require("../controllers/room.controller");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Get all rooms
router.get("/", authenticateToken, getRooms);

// Get room by ID
router.get("/:id", authenticateToken, getRoomById);

// Create room - Admin only
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  createRoom
);

// Update room - Admin only
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateRoom
);

module.exports = router;