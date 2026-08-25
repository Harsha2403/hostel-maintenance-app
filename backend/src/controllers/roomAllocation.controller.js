const prisma = require("../config/prisma");

// Create room allocation
const createRoomAllocation = async (req, res) => {
  try {
    const { studentId, roomId } = req.body;

    // Validate required fields
    if (!studentId || !roomId) {
      return res.status(400).json({
        success: false,
        message: "studentId and roomId are required",
      });
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Check if room is active
    if (!room.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot allocate an inactive room",
      });
    }

    // Check if student already has an active room
    const existingAllocation = await prisma.roomAllocation.findFirst({
      where: {
        studentId,
        status: "ACTIVE",
      },
    });

    if (existingAllocation) {
      return res.status(409).json({
        success: false,
        message: "Student already has an active room allocation",
      });
    }

    // Check current active allocations in room
    const activeAllocationsCount = await prisma.roomAllocation.count({
      where: {
        roomId,
        status: "ACTIVE",
      },
    });

    // Check room capacity
    if (activeAllocationsCount >= room.capacity) {
      return res.status(400).json({
        success: false,
        message: "Room capacity has been reached",
      });
    }

    // Create allocation
    const allocation = await prisma.roomAllocation.create({
      data: {
        studentId,
        roomId,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        room: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Room allocated successfully",
      data: allocation,
    });
  } catch (error) {
    console.error("Create room allocation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to allocate room",
    });
  }
};


// Get all room allocations
const getRoomAllocations = async (req, res) => {
  try {
    const allocations = await prisma.roomAllocation.findMany({
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        room: {
          include: {
            floor: {
              include: {
                block: true,
              },
            },
          },
        },
      },
      orderBy: {
        allocatedAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: allocations.length,
      data: allocations,
    });
  } catch (error) {
    console.error("Get room allocations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch room allocations",
    });
  }
};


// Get room allocation by ID
const getRoomAllocationById = async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await prisma.roomAllocation.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true
        }
      }
          },
        },
        room: {
          include: {
            floor: {
              include: {
                block: {
                  include: {
                    hostelBuilding: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: "Room allocation not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: allocation,
    });
  } catch (error) {
    console.error("Get room allocation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch room allocation",
    });
  }
};


// Vacate room
const vacateRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await prisma.roomAllocation.findUnique({
      where: { id },
    });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: "Room allocation not found",
      });
    }

    if (allocation.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "This room allocation is already inactive",
      });
    }

    const updatedAllocation = await prisma.roomAllocation.update({
      where: { id },
      data: {
        status: "VACATED",
        vacatedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Room vacated successfully",
      data: updatedAllocation,
    });
  } catch (error) {
    console.error("Vacate room error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to vacate room",
    });
  }
};


module.exports = {
  createRoomAllocation,
  getRoomAllocations,
  getRoomAllocationById,
  vacateRoom,
};