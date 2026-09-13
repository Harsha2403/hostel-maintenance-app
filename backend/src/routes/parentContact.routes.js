const express = require("express");

const {
  requestParentContact,
  verifyParentOtp,
  resendParentOtp,

  getPendingParentContacts,
  approveParentContact,
  rejectParentContact,

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

// ============================================================
// STUDENT: REQUEST NEW PARENT CONTACT
// ============================================================

router.post(
  "/request",
  authenticateToken,
  authorizeRoles("STUDENT"),
  requestParentContact
);

// ============================================================
// PARENT: VERIFY OTP
//
// No login required because the parent does not have an
// account yet.
// ============================================================

router.post(
  "/verify-otp",
  verifyParentOtp
);

// ============================================================
// STUDENT: RESEND OTP
// ============================================================

router.post(
  "/resend-otp",
  authenticateToken,
  authorizeRoles("STUDENT"),
  resendParentOtp
);

// ============================================================
// ADMIN: VIEW PENDING PARENT CONTACT REQUESTS
// ============================================================

router.get(
  "/pending",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getPendingParentContacts
);

// ============================================================
// ADMIN: APPROVE PARENT CONTACT
// ============================================================

router.put(
  "/:id/approve",
  authenticateToken,
  authorizeRoles("ADMIN"),
  approveParentContact
);

// ============================================================
// ADMIN: REJECT PARENT CONTACT
// ============================================================

router.put(
  "/:id/reject",
  authenticateToken,
  authorizeRoles("ADMIN"),
  rejectParentContact
);

// ============================================================
// ADMIN / WARDEN: CREATE OFFICIAL CONTACT
// ============================================================

router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  createParentContact
);

// ============================================================
// ADMIN / WARDEN: GET CONTACTS FOR STUDENT
// ============================================================

router.get(
  "/student/:studentId",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  getParentContactsByStudent
);

// ============================================================
// ADMIN / WARDEN: UPDATE
// ============================================================

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "WARDEN"),
  updateParentContact
);

// ============================================================
// ADMIN ONLY: DELETE
// ============================================================

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  deleteParentContact
);

module.exports = router;