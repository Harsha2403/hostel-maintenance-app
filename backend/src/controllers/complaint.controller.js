const prisma = require("../config/prisma");

// ==========================================
// GENERATE COMPLAINT NUMBER
// ==========================================

const generateComplaintNumber = async () => {
  const year = new Date().getFullYear();

  const lastComplaint = await prisma.complaint.findFirst({
    orderBy: {
      createdAt: "desc",
    },
  });

  let sequence = 1;

  if (
    lastComplaint &&
    lastComplaint.complaintNo &&
    lastComplaint.complaintNo.startsWith(`CMP${year}`)
  ) {
    const lastNumber = parseInt(
      lastComplaint.complaintNo.replace(
        `CMP${year}`,
        ""
      ),
      10
    );

    if (!isNaN(lastNumber)) {
      sequence = lastNumber + 1;
    }
  }

  return `CMP${year}${String(sequence).padStart(
    4,
    "0"
  )}`;
};

// ==========================================
// COMMON COMPLAINT INCLUDE
// ==========================================

const complaintInclude = {
  student: {
    include: {
      user: {
        select: {
          id: true,
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
    },
  },

  assignments: {
    where: {
      unassignedAt: null,
    },

    include: {
      assignedStaff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  },
};

// ==========================================
// CREATE COMPLAINT
// STUDENT ONLY
// ==========================================

const createComplaint = async (req, res) => {
  try {
    const {
      categoryId,
      title,
      description,
      priority,
    } = req.body;

    const userId = req.user.userId;

    if (
      !categoryId ||
      !title ||
      !description
    ) {
      return res.status(400).json({
        success: false,
        message:
          "categoryId, title and description are required",
      });
    }

    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        success: false,
        message:
          "Only students can create complaints",
      });
    }

    const student =
      await prisma.student.findUnique({
        where: {
          userId,
        },
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student profile not found",
      });
    }

    const roomAllocation =
      await prisma.roomAllocation.findFirst({
        where: {
          studentId: student.id,
          status: "ACTIVE",
        },

        orderBy: {
          allocatedAt: "desc",
        },
      });

    if (!roomAllocation) {
      return res.status(400).json({
        success: false,
        message:
          "No active room allocation found",
      });
    }

    const category =
      await prisma.complaintCategory.findUnique({
        where: {
          id: categoryId,
        },
      });

    if (!category) {
      return res.status(404).json({
        success: false,
        message:
          "Complaint category not found",
      });
    }

    if (!category.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "Complaint category is inactive",
      });
    }

    const complaintNo =
      await generateComplaintNumber();

    const complaint =
      await prisma.complaint.create({
        data: {
          complaintNo,
          studentId: student.id,
          categoryId,
          roomId: roomAllocation.roomId,
          title: title.trim(),
          description: description.trim(),
          priority: priority || "MEDIUM",
          status: "OPEN",
        },

        include: complaintInclude,
      });

    return res.status(201).json({
      success: true,
      message:
        "Complaint created successfully",
      data: complaint,
    });
  } catch (error) {
    console.error(
      "Create complaint error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create complaint",
    });
  }
};

// ==========================================
// GET ALL COMPLAINTS
// ADMIN
// ==========================================

const getComplaints = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Only admin can view all complaints",
      });
    }

    const complaints =
      await prisma.complaint.findMany({
        include: complaintInclude,

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
    console.error(
      "Get complaints error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch complaints",
    });
  }
};

// ==========================================
// GET SINGLE COMPLAINT
// ADMIN OR ASSIGNED MAINTENANCE STAFF
// ==========================================

const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint =
      await prisma.complaint.findUnique({
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
            },
          },

          attachments: true,

          assignments: {
            where: {
              unassignedAt: null,
            },

            include: {
              assignedStaff: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  role: true,
                },
              },
            },
          },

          statusHistory: {
            orderBy: {
              createdAt: "desc",
            },
          },

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

    const activeAssignment =
      complaint.assignments.find(
        (assignment) =>
          assignment.unassignedAt === null
      );

    const responseData = {
      ...complaint,

      assignedTo:
        activeAssignment?.assignedStaff ||
        null,
    };

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error(
      "Get complaint by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch complaint",
    });
  }
};

// ==========================================
// ADMIN ASSIGN / REASSIGN COMPLAINT
// ==========================================

const assignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Only admin can assign complaints",
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message:
          "assignedTo is required",
      });
    }

    const complaint =
      await prisma.complaint.findUnique({
        where: {
          id,
        },
      });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message:
          "Complaint not found",
      });
    }

    if (
      complaint.status === "CLOSED" ||
      complaint.status === "CANCELLED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Cannot assign a ${complaint.status} complaint`,
      });
    }

    const staff =
      await prisma.user.findUnique({
        where: {
          id: assignedTo,
        },
      });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message:
          "Maintenance staff not found",
      });
    }

    if (
      staff.role !==
      "MAINTENANCE_STAFF"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Complaint can only be assigned to maintenance staff",
      });
    }

    const result =
      await prisma.$transaction(
        async (tx) => {
          // Remove old active assignment
          await tx.complaintAssignment.updateMany({
            where: {
              complaintId: id,
              unassignedAt: null,
            },

            data: {
              unassignedAt:
                new Date(),
            },
          });

          // Create new assignment
          const assignment =
            await tx.complaintAssignment.create({
              data: {
                complaintId: id,
                assignedTo,
                assignedBy:
                  req.user.userId,
              },
            });

          // Change complaint status
          const updatedComplaint =
            await tx.complaint.update({
              where: {
                id,
              },

              data: {
                status: "ASSIGNED",
              },

              include:
                complaintInclude,
            });

          // Status history
          await tx.complaintStatusHistory.create({
            data: {
              complaintId: id,
              oldStatus:
                complaint.status,
              newStatus:
                "ASSIGNED",
              changedBy:
                req.user.userId,
              remarks: `Assigned to ${staff.firstName} ${staff.lastName}`,
            },
          });

          return {
            assignment,
            complaint:
              updatedComplaint,
          };
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Complaint assigned successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Assign complaint error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to assign complaint",
    });
  }
};

// ==========================================
// MAINTENANCE STAFF
// GET MY ASSIGNED COMPLAINTS
// ==========================================

const getMyAssignedComplaints =
  async (req, res) => {
    try {
      const userId =
        req.user.userId;

      if (
        req.user.role !==
        "MAINTENANCE_STAFF"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only maintenance staff can access this endpoint",
        });
      }

      const complaints =
        await prisma.complaint.findMany({
          where: {
            assignments: {
              some: {
                assignedTo:
                  userId,

                unassignedAt:
                  null,
              },
            },
          },

          include:
            complaintInclude,

          orderBy: {
            createdAt: "desc",
          },
        });

      return res.status(200).json({
        success: true,
        count:
          complaints.length,
        data:
          complaints,
      });
    } catch (error) {
      console.error(
        "Get assigned complaints error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch assigned complaints",
      });
    }
  };

// ==========================================
// MAINTENANCE STAFF
// UPDATE STATUS
// ==========================================

const updateComplaintStatus =
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        status,
        remarks,
      } = req.body;

      const userId =
        req.user.userId;

      // ADMIN CANNOT UPDATE STATUS
      if (
        req.user.role ===
        "ADMIN"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin can only assign or reassign complaints",
        });
      }

      // ONLY MAINTENANCE STAFF
      if (
        req.user.role !==
        "MAINTENANCE_STAFF"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only maintenance staff can update complaint status",
        });
      }

      const complaint =
        await prisma.complaint.findUnique({
          where: {
            id,
          },
        });

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message:
            "Complaint not found",
        });
      }

      // CHECK ACTIVE ASSIGNMENT
      const assignment =
        await prisma.complaintAssignment.findFirst({
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
            "You are not assigned to this complaint",
        });
      }

      // VALID TRANSITIONS
      if (
        complaint.status ===
          "ASSIGNED" &&
        status ===
          "IN_PROGRESS"
      ) {
        // allowed
      } else if (
        complaint.status ===
          "IN_PROGRESS" &&
        status ===
          "RESOLVED"
      ) {
        // allowed
      } else {
        return res.status(400).json({
          success: false,
          message: `Cannot change complaint from ${complaint.status} to ${status}`,
        });
      }

      const updatedComplaint =
        await prisma.$transaction(
          async (tx) => {
            const updated =
              await tx.complaint.update({
                where: {
                  id,
                },

                data: {
                  status,
                },
              });

            await tx.complaintStatusHistory.create({
              data: {
                complaintId: id,

                oldStatus:
                  complaint.status,

                newStatus:
                  status,

                changedBy:
                  userId,

                remarks:
                  remarks || null,
              },
            });

            // Create resolution record
            // when complaint is resolved
            if (
              status === "RESOLVED"
            ) {
              await tx.complaintResolution.upsert({
                where: {
                  complaintId: id,
                },

                update: {
                  resolvedBy:
                    userId,

                  resolutionNote:
                    remarks ||
                    "Complaint resolved",

                  resolvedAt:
                    new Date(),
                },

                create: {
                  complaintId:
                    id,

                  resolvedBy:
                    userId,

                  resolutionNote:
                    remarks ||
                    "Complaint resolved",
                },
              });
            }

            return updated;
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "Complaint status updated successfully",
        data:
          updatedComplaint,
      });
    } catch (error) {
      console.error(
        "Update complaint status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update complaint status",
      });
    }
  };

  // ==========================================
// ADMIN - CLOSE RESOLVED COMPLAINT
// ==========================================

const closeComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    // ------------------------------------------
    // ONLY ADMIN CAN CLOSE
    // ------------------------------------------

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admin can close complaints",
      });
    }

    // ------------------------------------------
    // FIND COMPLAINT
    // ------------------------------------------

    const complaint =
      await prisma.complaint.findUnique({
        where: {
          id,
        },
      });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // ------------------------------------------
    // ONLY RESOLVED COMPLAINT CAN BE CLOSED
    // ------------------------------------------

    if (complaint.status !== "RESOLVED") {
      return res.status(400).json({
        success: false,
        message:
          `Only RESOLVED complaints can be closed. Current status: ${complaint.status}`,
      });
    }

    // ------------------------------------------
    // CLOSE COMPLAINT
    // ------------------------------------------

    const result =
      await prisma.$transaction(
        async (tx) => {
          // --------------------------------------
          // CHANGE STATUS TO CLOSED
          // --------------------------------------

          const updatedComplaint =
            await tx.complaint.update({
              where: {
                id,
              },

              data: {
                status: "CLOSED",
              },

              include: complaintInclude,
            });

          // --------------------------------------
          // CREATE STATUS HISTORY
          // --------------------------------------

          await tx.complaintStatusHistory.create({
            data: {
              complaintId: id,

              oldStatus: "RESOLVED",

              newStatus: "CLOSED",

              changedBy: req.user.userId,

              remarks:
                remarks?.trim() ||
                "Complaint reviewed and closed by Admin",
            },
          });

          // --------------------------------------
          // REMOVE ACTIVE ASSIGNMENT
          //
          // This means the complaint will no longer
          // appear in Maintenance Staff's active
          // complaint list.
          // --------------------------------------

          await tx.complaintAssignment.updateMany({
            where: {
              complaintId: id,

              unassignedAt: null,
            },

            data: {
              unassignedAt: new Date(),
            },
          });

          return updatedComplaint;
        }
      );

    return res.status(200).json({
      success: true,

      message:
        "Complaint closed successfully",

      data: result,
    });

  } catch (error) {
    console.error(
      "Close complaint error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to close complaint",
    });
  }
};

  // ==========================================
// STUDENT - GET MY OWN COMPLAINTS
// ==========================================

const getMyComplaints = async (req, res) => {
  try {

    const userId = req.user.userId;


    // Only students can access this endpoint

    if (req.user.role !== "STUDENT") {

      return res.status(403).json({
        success: false,
        message:
          "Only students can view their own complaints",
      });

    }


    // Find student profile

    const student =
      await prisma.student.findFirst({

        where: {
          userId: userId,
        },

      });


    if (!student) {

      return res.status(404).json({
        success: false,
        message:
          "Student profile not found",
      });

    }


    // Get complaints belonging only to this student

    const complaints =
      await prisma.complaint.findMany({

        where: {
          studentId: student.id,
        },


        include: {

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
            },
          },


          assignments: {

            where: {
              unassignedAt: null,
            },


            include: {

              assignedStaff: {

                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
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

      count:
        complaints.length,

      data:
        complaints,

    });

  } catch (error) {

    console.error(
      "Get my complaints error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to fetch your complaints",

    });

  }
};
// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createComplaint,
  getComplaints,
  getMyComplaints,
  getMyAssignedComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  closeComplaint,
};
