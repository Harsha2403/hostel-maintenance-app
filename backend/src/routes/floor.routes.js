const express = require("express");

const {
  createFloor,
  getFloors,
  getFloorById,
  updateFloor
} = require("../controllers/floor.controller");

const {
  authenticateToken,
  authorizeRoles
} = require("../middleware/auth.middleware");

const router = express.Router();

// Create floor - ADMIN only
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  createFloor
);

// Get all floors
router.get(
  "/",
  authenticateToken,
  getFloors
);

// Get one floor
router.get(
  "/:id",
  authenticateToken,
  getFloorById
);

// Update floor - ADMIN only
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateFloor
);

module.exports = router;