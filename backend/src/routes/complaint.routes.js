const express = require("express");

const router = express.Router();

const {
  createComplaint,
  getComplaints,
  getMyComplaints,
  getMyAssignedComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  closeComplaint,
} = require("../controllers/complaint.controller");

const {
  authenticateToken,
} = require("../middleware/auth.middleware");


// ==========================================
// STUDENT - CREATE COMPLAINT
// ==========================================

router.post(
  "/",
  authenticateToken,
  createComplaint
);


// ==========================================
// STUDENT - GET MY OWN COMPLAINTS
// ==========================================

router.get(
  "/my-complaints",
  authenticateToken,
  getMyComplaints
);


// ==========================================
// MAINTENANCE STAFF - GET ASSIGNED COMPLAINTS
// ==========================================

router.get(
  "/my-assigned",
  authenticateToken,
  getMyAssignedComplaints
);


// ==========================================
// ADMIN - GET ALL COMPLAINTS
// ==========================================

router.get(
  "/",
  authenticateToken,
  getComplaints
);


// ==========================================
// ADMIN - ASSIGN COMPLAINT
// ==========================================

router.post(
  "/:id/assign",
  authenticateToken,
  assignComplaint
);

// ==========================================
// ADMIN - CLOSE RESOLVED COMPLAINT
// ==========================================
router.put(
  "/:id/close",
  authenticateToken,
  closeComplaint
);

// ==========================================
// MAINTENANCE STAFF - UPDATE STATUS
// ==========================================

router.put(
  "/:id/status",
  authenticateToken,
  updateComplaintStatus
);


// ==========================================
// GET SINGLE COMPLAINT
// KEEP THIS LAST
// ==========================================

router.get(
  "/:id",
  authenticateToken,
  getComplaintById
);


module.exports = router;
