const prisma = require("../config/prisma");

// ==========================================================
// CREATE ROOM ALLOCATION
// ADMIN / WARDEN
// ==========================================================

const createRoomAllocation = async (req, res) => {
  try {
    const {
      studentId,
      roomId,
    } = req.body;

    // ========================================================
    // VALIDATE REQUIRED FIELDS
    // ========================================================

    if (!studentId || !roomId) {
      return res.status(400).json({
        success: false,
        message:
          "studentId and roomId are required",
      });
    }

    // ========================================================
    // GET STUDENT
    // ========================================================

    const student =
      await prisma.student.findUnique({
        where: {
          id: studentId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              isActive: true,
            },
          },
        },
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // ========================================================
    // STUDENT MUST BE ACTIVE
    // ========================================================

    if (student.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message:
          "Only active students can be allocated a room",
      });
    }

    // ========================================================
    // STUDENT MUST HAVE GENDER
    // ========================================================

    if (!student.gender) {
      return res.status(400).json({
        success: false,
        message:
          "Student gender is not configured",
      });
    }

    // ========================================================
    // GET ROOM + FLOOR + BLOCK
    // ========================================================

    const room =
      await prisma.room.findUnique({
        where: {
          id: roomId,
        },

        include: {
          floor: {
            include: {
              block: true,
            },
          },
        },
      });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // ========================================================
    // ROOM ACTIVE CHECK
    // ========================================================

    if (!room.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot allocate an inactive room",
      });
    }

    // ========================================================
    // BLOCK ACTIVE CHECK
    // ========================================================

    if (
      !room.floor ||
      !room.floor.block
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Room is not properly associated with a block",
      });
    }

    const block =
      room.floor.block;

    if (!block.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot allocate a room in an inactive block",
      });
    }

    // ========================================================
    // GENDER → BLOCK TYPE VALIDATION
    // ========================================================

    const expectedBlockType =
      student.gender === "MALE"
        ? "BOYS"
        : "GIRLS";

    if (
      block.type !== expectedBlockType
    ) {
      if (student.gender === "MALE") {
        return res.status(400).json({
          success: false,
          message:
            "Male students can only be allocated to boys blocks.",
        });
      }

      if (student.gender === "FEMALE") {
        return res.status(400).json({
          success: false,
          message:
            "Female students can only be allocated to girls blocks.",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          "Student gender does not match the selected block.",
      });
    }

    // ========================================================
    // CHECK EXISTING ACTIVE ROOM
    // ========================================================

    const existingAllocation =
      await prisma.roomAllocation.findFirst({
        where: {
          studentId,
          status: "ACTIVE",
        },
      });

    if (existingAllocation) {
      return res.status(409).json({
        success: false,
        message:
          "Student already has an active room allocation",
      });
    }

    // ========================================================
    // COUNT ACTIVE ALLOCATIONS
    // ========================================================

    const activeAllocationsCount =
      await prisma.roomAllocation.count({
        where: {
          roomId,
          status: "ACTIVE",
        },
      });

    // ========================================================
    // CHECK ROOM CAPACITY
    // ========================================================

    if (
      activeAllocationsCount >=
      room.capacity
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Room capacity has been reached",
      });
    }

    // ========================================================
    // CREATE ALLOCATION
    // ========================================================

    const allocation =
      await prisma.roomAllocation.create({
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

    // ========================================================
    // SUCCESS
    // ========================================================

    return res.status(201).json({
      success: true,
      message:
        "Room allocated successfully",
      data: allocation,
    });

  } catch (error) {
    console.error(
      "Create room allocation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to allocate room",
    });
  }
};


// ==========================================================
// GET ALL ROOM ALLOCATIONS
// ==========================================================

const getRoomAllocations = async (
  req,
  res
) => {
  try {
    const allocations =
      await prisma.roomAllocation.findMany({
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
    console.error(
      "Get room allocations error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch room allocations",
    });
  }
};


// ==========================================================
// GET ROOM ALLOCATION BY ID
// ==========================================================

const getRoomAllocationById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const allocation =
      await prisma.roomAllocation.findUnique({
        where: {
          id,
        },

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
                  isActive: true,
                },
              },
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
        message:
          "Room allocation not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: allocation,
    });

  } catch (error) {
    console.error(
      "Get room allocation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch room allocation",
    });
  }
};


// ==========================================================
// VACATE ROOM
// ==========================================================

const vacateRoom = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const allocation =
      await prisma.roomAllocation.findUnique({
        where: {
          id,
        },
      });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message:
          "Room allocation not found",
      });
    }

    if (
      allocation.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This room allocation is already inactive",
      });
    }

    const updatedAllocation =
      await prisma.roomAllocation.update({
        where: {
          id,
        },

        data: {
          status: "VACATED",
          vacatedAt: new Date(),
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Room vacated successfully",
      data: updatedAllocation,
    });

  } catch (error) {
    console.error(
      "Vacate room error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to vacate room",
    });
  }
};


// ==========================================================
// ACTIVATE ROOM ALLOCATION
// ==========================================================

const activateRoomAllocation = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const allocation =
      await prisma.roomAllocation.findUnique({
        where: {
          id,
        },
      });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message:
          "Room allocation not found",
      });
    }

    // ========================================================
    // CHECK WHETHER STUDENT ALREADY HAS ANOTHER
    // ACTIVE ROOM
    // ========================================================

    const anotherActiveAllocation =
      await prisma.roomAllocation.findFirst({
        where: {
          studentId:
            allocation.studentId,

          status: "ACTIVE",

          NOT: {
            id,
          },
        },
      });

    if (anotherActiveAllocation) {
      return res.status(409).json({
        success: false,
        message:
          "Student already has another active room allocation",
      });
    }

    const updatedAllocation =
      await prisma.roomAllocation.update({
        where: {
          id,
        },

        data: {
          status: "ACTIVE",
          vacatedAt: null,
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Room allocation activated successfully",
      data: updatedAllocation,
    });

  } catch (error) {
    console.error(
      "Activate room allocation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to activate room allocation",
    });
  }
};


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {
  createRoomAllocation,
  getRoomAllocations,
  getRoomAllocationById,
  vacateRoom,
  activateRoomAllocation,
};