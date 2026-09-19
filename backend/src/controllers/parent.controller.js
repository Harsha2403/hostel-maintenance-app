const prisma = require("../config/prisma");

const getParentDashboard = async (req, res) => {
  try {
    const parentUserId = req.user.userId;

    // Find the parent contact linked to the logged-in parent account
    const parentContact = await prisma.parentContact.findFirst({
      where: {
        parentUserId: parentUserId,
        status: "APPROVED",
      },

      include: {
        // Parent account details
        parentUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },

        // Student details
        student: {
          include: {
            // Active room allocation
            roomAllocations: {
              where: {
                status: "ACTIVE",
              },

              include: {
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

              orderBy: {
                allocatedAt: "desc",
              },

              take: 1,
            },

            // Complaints
            complaints: {
              orderBy: {
                createdAt: "desc",
              },
            },

            // Health requests
            healthRequests: {
              orderBy: {
                createdAt: "desc",
              },
            },

            // Emergency records
            emergencies: {
              orderBy: {
                createdAt: "desc",
              },
            },

            // Existing approved parent contacts
            parentContacts: {
              where: {
                status: "APPROVED",
              },

              select: {
                id: true,
                name: true,
                relationship: true,
                phone: true,
                email: true,
                isPrimary: true,
                isEmergencyContact: true,
              },
            },
          },
        },

        // Parent notifications
        notifications: {
          orderBy: {
            createdAt: "desc",
          },

          take: 20,
        },
      },
    });

    // No approved parent/student relationship found
    if (!parentContact) {
      return res.status(404).json({
        success: false,
        message:
          "Parent account is not linked to an approved student.",
      });
    }

    const student = parentContact.student;

    const activeRoomAllocation =
      student.roomAllocations?.[0] || null;

    const room = activeRoomAllocation?.room || null;

    /*
     * Create the parent's display name.
     *
     * Database stores:
     * firstName
     * lastName
     *
     * Frontend expects:
     * name
     */
    const parentName = `${parentContact.parentUser.firstName || ""} ${
      parentContact.parentUser.lastName || ""
    }`.trim();

    return res.status(200).json({
      success: true,

      data: {
        // =========================
        // PARENT ACCOUNT
        // =========================
        parent: {
          id: parentContact.parentUser.id,

          name: parentName,

          firstName: parentContact.parentUser.firstName,

          lastName: parentContact.parentUser.lastName,

          email: parentContact.parentUser.email,

          phone: parentContact.parentUser.phone,
        },

        // =========================
        // PARENT CONTACT
        // =========================
        parentContact: {
          id: parentContact.id,

          name: parentContact.name,

          relationship: parentContact.relationship,

          phone: parentContact.phone,

          email: parentContact.email,

          isPrimary: parentContact.isPrimary,

          isEmergencyContact:
            parentContact.isEmergencyContact,
        },

        // =========================
        // STUDENT
        // =========================
        student: {
          id: student.id,

          studentNumber: student.studentNumber,

          firstName: student.firstName,

          lastName: student.lastName,

          email: student.email,

          phone: student.phone,

          department: student.department,

          course: student.course,

          year: student.year,

          // Student status
          status: student.status,
        },

        // =========================
        // ROOM
        // =========================
        room: room
          ? {
              allocationId: activeRoomAllocation.id,

              roomId: room.id,

              roomNumber: room.roomNumber,

              floor: room.floor
                ? {
                    id: room.floor.id,

                    name: room.floor.name,

                    number: room.floor.number,
                  }
                : null,

              block: room.floor?.block
                ? {
                    id: room.floor.block.id,

                    name: room.floor.block.name,
                  }
                : null,

              hostel: room.floor?.block?.hostelBuilding
                ? {
                    id: room.floor.block.hostelBuilding.id,

                    name:
                      room.floor.block.hostelBuilding.name,
                  }
                : null,

              allocatedAt:
                activeRoomAllocation.allocatedAt,
            }
          : null,

        // =========================
        // COMPLAINTS
        // =========================
        complaints: student.complaints,

        // =========================
        // HEALTH REQUESTS
        // =========================
        healthRequests:
          student.healthRequests,

        // =========================
        // EMERGENCIES
        // =========================
        emergencies:
          student.emergencies,

        // =========================
        // PARENT CONTACTS
        // =========================
        // Kept in API for compatibility,
        // although parent.tsx no longer displays it.
        parentContacts:
          student.parentContacts,

        // =========================
        // NOTIFICATIONS
        // =========================
        notifications:
          parentContact.notifications,
      },
    });
  } catch (error) {
    console.error(
      "Get parent dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load parent dashboard",
      error: error.message,
    });
  }
};

module.exports = {
  getParentDashboard,
};