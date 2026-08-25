const prisma = require("../config/prisma");

// Create floor
const createFloor = async (req, res) => {
  try {
    const { blockId, floorNumber, name } = req.body;

    if (!blockId || floorNumber === undefined || floorNumber === null) {
      return res.status(400).json({
        success: false,
        message: "Block ID and floor number are required"
      });
    }

    const floorNumberInt = Number(floorNumber);

    if (!Number.isInteger(floorNumberInt) || floorNumberInt < 0) {
      return res.status(400).json({
        success: false,
        message: "Floor number must be a whole number greater than or equal to 0"
      });
    }

    // Check if block exists
    const block = await prisma.block.findUnique({
      where: {
        id: blockId
      }
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        message: "Block not found"
      });
    }

    // Check duplicate floor number
    const existingFloor = await prisma.floor.findUnique({
      where: {
        blockId_floorNumber: {
          blockId,
          floorNumber: floorNumberInt
        }
      }
    });

    if (existingFloor) {
      return res.status(409).json({
        success: false,
        message: "This floor number already exists in this block"
      });
    }

    const floor = await prisma.floor.create({
      data: {
        blockId,
        floorNumber: floorNumberInt,
        name: name || null
      }
    });

    return res.status(201).json({
      success: true,
      message: "Floor created successfully",
      data: floor
    });

  } catch (error) {
    console.error("Create floor error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create floor"
    });
  }
};


// Get all floors
const getFloors = async (req, res) => {
  try {
    const { blockId } = req.query;

    const where = {};

    if (blockId) {
      where.blockId = blockId;
    }

    const floors = await prisma.floor.findMany({
      where,
      include: {
        block: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        floorNumber: "asc"
      }
    });

    return res.status(200).json({
      success: true,
      data: floors
    });

  } catch (error) {
    console.error("Get floors error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch floors"
    });
  }
};


// Get floor by ID
const getFloorById = async (req, res) => {
  try {
    const { id } = req.params;

    const floor = await prisma.floor.findUnique({
      where: {
        id
      },
      include: {
        block: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        rooms: true
      }
    });

    if (!floor) {
      return res.status(404).json({
        success: false,
        message: "Floor not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: floor
    });

  } catch (error) {
    console.error("Get floor error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch floor"
    });
  }
};


// Update floor
const updateFloor = async (req, res) => {
  try {
    const { id } = req.params;
    const { floorNumber, name } = req.body;

    const existingFloor = await prisma.floor.findUnique({
      where: {
        id
      }
    });

    if (!existingFloor) {
      return res.status(404).json({
        success: false,
        message: "Floor not found"
      });
    }

    const data = {};

    if (floorNumber !== undefined) {
      const floorNumberInt = Number(floorNumber);

      if (!Number.isInteger(floorNumberInt) || floorNumberInt < 0) {
        return res.status(400).json({
          success: false,
          message: "Floor number must be a whole number greater than or equal to 0"
        });
      }

      data.floorNumber = floorNumberInt;
    }

    if (name !== undefined) {
      data.name = name;
    }

    const floor = await prisma.floor.update({
      where: {
        id
      },
      data
    });

    return res.status(200).json({
      success: true,
      message: "Floor updated successfully",
      data: floor
    });

  } catch (error) {
    console.error("Update floor error:", error);

    // Handles duplicate floor number in the same block
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This floor number already exists in this block"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update floor"
    });
  }
};


module.exports = {
  createFloor,
  getFloors,
  getFloorById,
  updateFloor
};