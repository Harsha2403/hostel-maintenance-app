const express = require("express");

const {
  createParentContact,
  getParentContactsByStudent,
  updateParentContact,
  deleteParentContact,
} = require("../controllers/parentContact.controller");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Create parent contact
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  createParentContact
);

// Get all contacts for a student
router.get(
  "/student/:studentId",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  getParentContactsByStudent
);

// Update parent contact
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  updateParentContact
);

// Delete parent contact
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  deleteParentContact
);

module.exports = router;