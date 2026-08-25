const express = require("express");

const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
} = require("../controllers/complaint.controller");

const {
  authenticateToken,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Create complaint
router.post("/", authenticateToken, createComplaint);

// Get all complaints
router.get("/", authenticateToken, getComplaints);

// Assign complaint
router.put("/:id/assign", authenticateToken, assignComplaint);

// Update complaint status
router.put("/:id/status", authenticateToken, updateComplaintStatus);

// Get complaint by ID
router.get("/:id", authenticateToken, getComplaintById);

// Update complaint status
router.put(
  "/:id/status",
  authenticateToken,
  updateComplaintStatus
);

// Assign complaint
router.post("/:id/assign", authenticateToken, assignComplaint);

module.exports = router;