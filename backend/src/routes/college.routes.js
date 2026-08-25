const express = require("express");

const {
  createCollege,
  getColleges,
  getCollegeById,
  updateCollege
} = require("../controllers/college.controller");

const {
  authenticateToken,
  authorizeRoles
} = require("../middleware/auth.middleware");

const router = express.Router();

// Only ADMIN can create a college
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  createCollege
);

// Any authenticated user can view colleges
router.get(
  "/",
  authenticateToken,
  getColleges
);

// Get one college
router.get(
  "/:id",
  authenticateToken,
  getCollegeById
);

// Only ADMIN can update
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateCollege
);

module.exports = router;