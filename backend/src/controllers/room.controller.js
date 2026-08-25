const prisma = require("../config/prisma");

// Create Room
const createRoom = async (req, res) => {
  try {
    const { floorId, roomNumber, capacity } = req.body;

    // Validate required fields
    if (!floorId || !roomNumber) {
      return res.status(400).json({
        success: false,
        message: "floorId and roomNumber are required",
      });
    }

    // Check if floor exists
    const floor = await prisma.floor.findUnique({
      where: { id: floorId },
    });

    if (!floor) {
      return res.status(404).json({
        success: false,
        message: "Floor not found",
      });
    }

    // Check duplicate room
    const existingRoom = await prisma.room.findFirst({
      where: {
        floorId,
        roomNumber,
      },
    });

    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: "Room number already exists on this floor",
      });
    }

    // Validate capacity
    if (capacity !== undefined && (!Number.isInteger(capacity) || capacity <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be a positive integer",
      });
    }

    const room = await prisma.room.create({
      data: {
        floorId,
        roomNumber,
        capacity: capacity || 3,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: room,
    });
  } catch (error) {
    console.error("Create room error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create room",
    });
  }
};

// Get all rooms
const getRooms = async (req, res) => {
  try {
    const { floorId } = req.query;

    const rooms = await prisma.room.findMany({
      where: floorId ? { floorId } : undefined,
      include: {
        floor: {
          include: {
            block: true,
          },
        },
      },
      orderBy: {
        roomNumber: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    console.error("Get rooms error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch rooms",
    });
  }
};

// Get room by ID
const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
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
        allocations: true,
        complaints: true,
      },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("Get room error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch room",
    });
  }
};

// Update Room
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNumber, capacity, isActive } = req.body;

    const existingRoom = await prisma.room.findUnique({
      where: { id },
    });

    if (!existingRoom) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (capacity !== undefined && (!Number.isInteger(capacity) || capacity <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be a positive integer",
      });
    }

    // Check duplicate room number if changing it
    if (roomNumber && roomNumber !== existingRoom.roomNumber) {
      const duplicateRoom = await prisma.room.findFirst({
        where: {
          floorId: existingRoom.floorId,
          roomNumber,
          NOT: {
            id,
          },
        },
      });

      if (duplicateRoom) {
        return res.status(409).json({
          success: false,
          message: "Room number already exists on this floor",
        });
      }
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(roomNumber !== undefined && { roomNumber }),
        ...(capacity !== undefined && { capacity }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: room,
    });
  } catch (error) {
    console.error("Update room error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update room",
    });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
};