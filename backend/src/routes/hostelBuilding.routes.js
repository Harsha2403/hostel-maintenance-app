const express = require("express");

const {
  createHostelBuilding,
  getHostelBuildings,
  getHostelBuildingById,
  updateHostelBuilding
} = require("../controllers/hostelBuilding.controller");

const {
  authenticateToken,
  authorizeRoles
} = require("../middleware/auth.middleware");

const router = express.Router();

// Create building - ADMIN only
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  createHostelBuilding
);

// Get all buildings
router.get(
  "/",
  authenticateToken,
  getHostelBuildings
);

// Get one building
router.get(
  "/:id",
  authenticateToken,
  getHostelBuildingById
);

// Update building - ADMIN only
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateHostelBuilding
);

module.exports = router;