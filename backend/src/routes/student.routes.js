const express = require("express");

const {
  createStudent,
  getStudents,
  getPendingStudents,
  approveStudent,
  rejectStudent,
  getStudentById,
  updateStudent,
} = require("../controllers/student.controller");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();


// ==========================================================
// GET ALL STUDENTS
// ==========================================================

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  getStudents
);


// ==========================================================
// GET PENDING STUDENTS
// IMPORTANT: THIS MUST COME BEFORE /:id
// ==========================================================

router.get(
  "/pending",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  getPendingStudents
);


// ==========================================================
// APPROVE STUDENT
// ADMIN ONLY
// ==========================================================

router.put(
  "/:id/approve",
  authenticateToken,
  authorizeRoles("ADMIN"),
  approveStudent
);


// ==========================================================
// REJECT STUDENT
// ADMIN ONLY
// ==========================================================

router.put(
  "/:id/reject",
  authenticateToken,
  authorizeRoles("ADMIN"),
  rejectStudent
);


// ==========================================================
// GET STUDENT BY ID
// ==========================================================

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  getStudentById
);


// ==========================================================
// CREATE STUDENT
// ADMIN ONLY
// ==========================================================

router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  createStudent
);


// ==========================================================
// UPDATE STUDENT
// ADMIN ONLY
// ==========================================================

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateStudent
);


module.exports = router;