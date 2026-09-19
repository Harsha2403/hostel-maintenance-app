const express = require("express");

const {
  getParentDashboard
} = require("../controllers/parent.controller");

const {
  authenticateToken,
  authorizeRoles
} = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles("PARENT"),
  getParentDashboard
);

module.exports = router;