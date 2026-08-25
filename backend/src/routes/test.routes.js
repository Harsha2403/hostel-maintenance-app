const express = require("express");

const {
  authenticateToken,
  authorizeRoles
} = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/profile",
  authenticateToken,
  (req, res) => {
    res.json({
      success: true,
      message: "Protected route accessed successfully",
      user: req.user
    });
  }
);

router.get(
  "/admin",
  authenticateToken,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Admin",
      user: req.user
    });
  }
);

module.exports = router;