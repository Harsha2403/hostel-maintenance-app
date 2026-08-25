const express = require("express");

const {
  createComplaintCategory,
  getComplaintCategories,
  getComplaintCategoryById,
  updateComplaintCategory,
} = require("../controllers/complaintCategory.controller");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Get all categories
router.get("/", authenticateToken, getComplaintCategories);

// Get category by ID
router.get("/:id", authenticateToken, getComplaintCategoryById);

// Create category - Admin only
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  createComplaintCategory
);

// Update category - Admin only
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateComplaintCategory
);

module.exports = router;