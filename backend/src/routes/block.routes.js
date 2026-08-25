const express = require("express");

const {
  createBlock,
  getBlocks,
  getBlockById,
  updateBlock
} = require("../controllers/block.controller");

const {
  authenticateToken,
  authorizeRoles
} = require("../middleware/auth.middleware");

const router = express.Router();

// Create block - ADMIN only
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  createBlock
);

// Get all blocks
router.get(
  "/",
  authenticateToken,
  getBlocks
);

// Get one block
router.get(
  "/:id",
  authenticateToken,
  getBlockById
);

// Update block - ADMIN only
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateBlock
);

module.exports = router;