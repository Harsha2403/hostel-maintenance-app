const express = require("express");

const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
} = require("../controllers/student.controller");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Get all students - Admin and Warden
router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  getStudents
);

// Get student by ID
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  getStudentById
);

// Create student - Admin only
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  createStudent
);

// Update student - Admin only
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateStudent
);

module.exports = router;