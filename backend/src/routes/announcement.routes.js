const express = require("express");

const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  updateAnnouncementStatus,
  deleteAnnouncement,
  getStudentAnnouncements,
  getParentAnnouncements,
} = require("../controllers/announcement.controller");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// ==========================================================
// STUDENT
// ==========================================================

router.get(
  "/student",
  authenticateToken,
  authorizeRoles("STUDENT"),
  getStudentAnnouncements
);

// ==========================================================
// PARENT
// ==========================================================

router.get(
  "/parent",
  authenticateToken,
  authorizeRoles("PARENT"),
  getParentAnnouncements
);

// ==========================================================
// ADMIN
// ==========================================================

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getAnnouncements
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  createAnnouncement
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getAnnouncementById
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateAnnouncement
);

router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateAnnouncementStatus
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  deleteAnnouncement
);

module.exports = router;