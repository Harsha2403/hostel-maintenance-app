const prisma = require("../config/prisma");

// Create a block
const createBlock = async (req, res) => {
  try {
    const { hostelBuildingId, name, type } = req.body;

    if (!hostelBuildingId || !name || !type) {
      return res.status(400).json({
        success: false,
        message: "Hostel building ID, block name, and block type are required"
      });
    }

    // Validate block type
    if (!["BOYS", "GIRLS"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Block type must be BOYS or GIRLS"
      });
    }

    // Check whether hostel building exists
    const hostelBuilding = await prisma.hostelBuilding.findUnique({
      where: {
        id: hostelBuildingId
      }
    });

    if (!hostelBuilding) {
      return res.status(404).json({
        success: false,
        message: "Hostel building not found"
      });
    }

    // Check duplicate block
    const existingBlock = await prisma.block.findFirst({
      where: {
        hostelBuildingId,
        name
      }
    });

    if (existingBlock) {
      return res.status(409).json({
        success: false,
        message: "A block with this name already exists in this hostel building"
      });
    }

    // Create block
    const block = await prisma.block.create({
      data: {
        hostelBuildingId,
        name,
        type
      }
    });

    return res.status(201).json({
      success: true,
      message: "Block created successfully",
      data: block
    });

  } catch (error) {
    console.error("Create block error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create block"
    });
  }
};


// Get all blocks
const getBlocks = async (req, res) => {
  try {
    const { hostelBuildingId } = req.query;

    const where = {};

    if (hostelBuildingId) {
      where.hostelBuildingId = hostelBuildingId;
    }

    const blocks = await prisma.block.findMany({
      where,
      include: {
        hostelBuilding: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({
      success: true,
      data: blocks
    });

  } catch (error) {
    console.error("Get blocks error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch blocks"
    });
  }
};


// Get block by ID
const getBlockById = async (req, res) => {
  try {
    const { id } = req.params;

    const block = await prisma.block.findUnique({
      where: {
        id
      },
      include: {
        hostelBuilding: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        floors: true
      }
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        message: "Block not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: block
    });

  } catch (error) {
    console.error("Get block error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch block"
    });
  }
};


// Update block
const updateBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, isActive } = req.body;

    if (type && !["BOYS", "GIRLS"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Block type must be BOYS or GIRLS"
      });
    }

    const existingBlock = await prisma.block.findUnique({
      where: {
        id
      }
    });

    if (!existingBlock) {
      return res.status(404).json({
        success: false,
        message: "Block not found"
      });
    }

    const block = await prisma.block.update({
      where: {
        id
      },
      data: {
        name,
        type,
        isActive
      }
    });

    return res.status(200).json({
      success: true,
      message: "Block updated successfully",
      data: block
    });

  } catch (error) {
    console.error("Update block error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update block"
    });
  }
};


module.exports = {
  createBlock,
  getBlocks,
  getBlockById,
  updateBlock
};