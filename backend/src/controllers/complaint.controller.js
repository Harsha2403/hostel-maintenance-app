const prisma = require("../config/prisma");

// Generate Complaint Number
const generateComplaintNumber = async () => {
  const year = new Date().getFullYear();

  const lastComplaint = await prisma.complaint.findFirst({
    orderBy: {
      createdAt: "desc",
    },
  });

  let sequence = 1;

  if (lastComplaint && lastComplaint.complaintNo) {
    const lastNumber = parseInt(
      lastComplaint.complaintNo.replace(`CMP${year}`, ""),
      10
    );

    if (!isNaN(lastNumber)) {
      sequence = lastNumber + 1;
    }
  }

  return `CMP${year}${String(sequence).padStart(4, "0")}`;
};

// Create Complaint
const createComplaint = async (req, res) => {
  try {
    const {
      studentId,
      categoryId,
      roomId,
      title,
      description,
      priority,
    } = req.body;

    if (
      !studentId ||
      !categoryId ||
      !roomId ||
      !title ||
      !description
    ) {
      return res.status(400).json({
        success: false,
        message:
          "studentId, categoryId, roomId, title and description are required",
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const category = await prisma.complaintCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Complaint category not found",
      });
    }

    if (!category.isActive) {
      return res.status(400).json({
        success: false,
        message: "This complaint category is inactive",
      });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const complaintNo = await generateComplaintNumber();

    const complaint = await prisma.complaint.create({
      data: {
        complaintNo,
        studentId,
        categoryId,
        roomId,
        title: title.trim(),
        description: description.trim(),
        priority: priority || "MEDIUM",
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

        category: true,

        room: {
          select: {
            id: true,
            roomNumber: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("Create complaint error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create complaint",
    });
  }
};

// Get All Complaints
const getComplaints = async (req, res) => {
  try {
    const { status, priority, categoryId, studentId } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    const complaints = await prisma.complaint.findMany({
      where,

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

        category: {
          select: {
            id: true,
            name: true,
          },
        },

        room: {
          select: {
            id: true,
            roomNumber: true,

            floor: {
              select: {
                name: true,

                block: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error("Get complaints error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaints",
    });
  }
};

// Get Complaint By ID
const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await prisma.complaint.findUnique({
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

        category: true,

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

        attachments: true,
        assignments: true,
        statusHistory: true,
        resolution: true,
        feedback: true,
      },
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Get complaint by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint",
    });
  }
};

// Update Complaint Status
const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const userId = req.user.userId;
    const userRole = req.user.role;

    const validStatuses = [
      "OPEN",
      "ASSIGNED",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
      "REOPENED",
      "CANCELLED",
    ];

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint status",
      });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Prevent updating to same status
    if (complaint.status === status) {
      return res.status(400).json({
        success: false,
        message: `Complaint is already in ${status} status`,
      });
    }

    /*
      STATUS WORKFLOW

      OPEN
        ↓ Admin assigns
      ASSIGNED
        ↓ Maintenance Staff
      IN_PROGRESS
        ↓ Maintenance Staff
      RESOLVED
        ↓ Admin
      CLOSED
    */

    // ============================
    // MAINTENANCE STAFF PERMISSIONS
    // ============================

    if (userRole === "MAINTENANCE_STAFF") {
      // Check whether complaint is assigned to this staff member
      const assignment = await prisma.complaintAssignment.findFirst({
        where: {
          complaintId: id,
          assignedTo: userId,
          unassignedAt: null,
        },
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message:
            "You are not assigned to this complaint and cannot update its status",
        });
      }

      // ASSIGNED -> IN_PROGRESS
      if (
        complaint.status === "ASSIGNED" &&
        status === "IN_PROGRESS"
      ) {
        // Allowed
      }

      // IN_PROGRESS -> RESOLVED
      else if (
        complaint.status === "IN_PROGRESS" &&
        status === "RESOLVED"
      ) {
        // Allowed
      }

      else {
        return res.status(403).json({
          success: false,
          message: `Maintenance staff cannot change complaint from ${complaint.status} to ${status}`,
        });
      }
    }

    // ============================
    // ADMIN PERMISSIONS
    // ============================

    else if (userRole === "ADMIN") {
      const allowedTransitions = {
        OPEN: ["ASSIGNED", "CANCELLED"],
        ASSIGNED: ["CANCELLED"],
        IN_PROGRESS: ["RESOLVED", "CANCELLED"],
        RESOLVED: ["CLOSED", "REOPENED"],
        CLOSED: ["REOPENED"],
        REOPENED: ["IN_PROGRESS", "CANCELLED"],
        CANCELLED: [],
      };

      if (
        !allowedTransitions[complaint.status] ||
        !allowedTransitions[complaint.status].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${complaint.status} to ${status}`,
        });
      }
    }

    // ============================
    // OTHER USERS
    // ============================

    else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update complaint status",
      });
    }

    // Update complaint and create status history
    const updatedComplaint = await prisma.$transaction(async (tx) => {
      const updated = await tx.complaint.update({
        where: { id },
        data: {
          status,

          ...(status === "CANCELLED" && {
            cancelledAt: new Date(),
          }),
        },
      });

      await tx.complaintStatusHistory.create({
        data: {
          complaintId: id,
          oldStatus: complaint.status,
          newStatus: status,
          changedBy: userId,
          remarks: remarks || null,
        },
      });

      return updated;
    });

    return res.status(200).json({
      success: true,
      message: "Complaint status updated successfully",
      data: updatedComplaint,
    });
  } catch (error) {
    console.error("Update complaint status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update complaint status",
    });
  }
};

// Assign Complaint
const assignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    // Only admin can assign complaints
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only an admin can assign complaints",
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: "assignedTo is required",
      });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Cannot assign closed or cancelled complaint
    if (
      complaint.status === "CLOSED" ||
      complaint.status === "CANCELLED"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign a ${complaint.status} complaint`,
      });
    }

    const staff = await prisma.user.findUnique({
      where: { id: assignedTo },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Assigned user not found",
      });
    }

    // Only maintenance staff can be assigned
    if (staff.role !== "MAINTENANCE_STAFF") {
      return res.status(400).json({
        success: false,
        message: "Complaint can only be assigned to maintenance staff",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Unassign any existing active assignment
      await tx.complaintAssignment.updateMany({
        where: {
          complaintId: id,
          unassignedAt: null,
        },
        data: {
          unassignedAt: new Date(),
        },
      });

      // Create new assignment
      const assignment = await tx.complaintAssignment.create({
        data: {
          complaintId: id,
          assignedTo,
          assignedBy: req.user.userId,
        },
      });

      // Update complaint status
      const updatedComplaint = await tx.complaint.update({
        where: { id },
        data: {
          status: "ASSIGNED",
        },
      });

      // Create status history
      await tx.complaintStatusHistory.create({
        data: {
          complaintId: id,
          oldStatus: complaint.status,
          newStatus: "ASSIGNED",
          changedBy: req.user.userId,
          remarks: `Complaint assigned to ${staff.firstName} ${staff.lastName}`,
        },
      });

      return {
        assignment,
        complaint: updatedComplaint,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Complaint assigned successfully",
      data: result,
    });
  } catch (error) {
    console.error("Assign complaint error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign complaint",
    });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
};