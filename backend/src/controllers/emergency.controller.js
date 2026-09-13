const prisma = require("../config/prisma");

// ============================================================
// STUDENT - CREATE EMERGENCY
// ============================================================

const createEmergency = async (
  req,
  res
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const {
      severity,
      description,
    } = req.body;

    const validSeverities = [
      "HIGH",
      "CRITICAL",
    ];

    if (!severity || !description) {
      return res.status(400).json({
        success: false,
        message:
          "severity and description are required",
      });
    }

    if (
      !validSeverities.includes(
        severity
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid emergency severity",
      });
    }

    // --------------------------------------------------------
    // GET STUDENT
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // CREATE HEALTH REQUEST + EMERGENCY
    // --------------------------------------------------------

    const result =
      await prisma.$transaction(
        async (tx) => {
          const healthRequest =
            await tx.healthRequest.create({
              data: {
                studentId: student.id,
                requestType: "EMERGENCY",
                description:
                  String(description).trim(),
                priority: "EMERGENCY",
                status: "REPORTED",
              },
            });

          const emergency =
            await tx.emergency.create({
              data: {
                healthRequestId:
                  healthRequest.id,
                studentId:
                  student.id,
                severity,
                description:
                  String(description).trim(),
                status: "ACTIVE",
                reportedById:
                  userId,
              },
            });

          return {
            healthRequest,
            emergency,
          };
        }
      );

    // --------------------------------------------------------
    // CREATE PARENT NOTIFICATION RECORDS
    //
    // Only approved emergency contacts are selected.
    // Actual SMS delivery will be handled by the notification
    // service once a Twilio Messaging sender is configured.
    // --------------------------------------------------------

    const emergencyParents =
      await prisma.parentContact.findMany({
        where: {
          studentId: student.id,
          status: "APPROVED",
          isEmergencyContact: true,
        },
      });

    if (emergencyParents.length > 0) {
      await prisma.parentNotification.createMany(
        {
          data: emergencyParents.map(
            (parent) => ({
              emergencyId:
                result.emergency.id,
              parentContactId:
                parent.id,
              notificationType: "SMS",
              status: "PENDING",
            })
          ),
        }
      );
    }

    const emergencyWithNotifications =
      await prisma.emergency.findUnique({
        where: {
          id: result.emergency.id,
        },

        include: {
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

          parentNotifications: {
            include: {
              parentContact: true,
            },
          },
        },
      });

    return res.status(201).json({
      success: true,
      message:
        "Emergency reported successfully",
      data: emergencyWithNotifications,
    });
  } catch (error) {
    console.error(
      "Create emergency error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create emergency",
    });
  }
};

// ============================================================
// STUDENT - GET MY EMERGENCIES
// ============================================================

const getMyEmergencies = async (
  req,
  res
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
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

    const emergencies =
      await prisma.emergency.findMany({
        where: {
          studentId: student.id,
        },

        include: {
          healthRequest: true,
          parentNotifications: {
            include: {
              parentContact: true,
            },
          },
        },

        orderBy: {
          reportedAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      count: emergencies.length,
      data: emergencies,
    });
  } catch (error) {
    console.error(
      "Get my emergencies error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch emergencies",
    });
  }
};

// ============================================================
// ADMIN / WARDEN - GET ALL EMERGENCIES
// ============================================================

const getEmergencies = async (
  req,
  res
) => {
  try {
    const emergencies =
      await prisma.emergency.findMany({
        include: {
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

          healthRequest: true,

          handledBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },

          parentNotifications: {
            include: {
              parentContact: true,
            },
          },
        },

        orderBy: {
          reportedAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      count: emergencies.length,
      data: emergencies,
    });
  } catch (error) {
    console.error(
      "Get emergencies error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch emergencies",
    });
  }
};

// ============================================================
// ADMIN / WARDEN - GET SINGLE EMERGENCY
// ============================================================

const getEmergencyById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const emergency =
      await prisma.emergency.findUnique({
        where: {
          id,
        },

        include: {
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

              parentContacts: {
                where: {
                  status: "APPROVED",
                },
              },
            },
          },

          healthRequest: true,

          handledBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },

          parentNotifications: {
            include: {
              parentContact: true,
            },
          },
        },
      });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message:
          "Emergency not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: emergency,
    });
  } catch (error) {
    console.error(
      "Get emergency by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch emergency",
    });
  }
};

// ============================================================
// ADMIN / WARDEN - UPDATE EMERGENCY STATUS
// ============================================================

const updateEmergencyStatus =
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        status,
      } = req.body;

      const validStatuses = [
        "ACTIVE",
        "ACKNOWLEDGED",
        "RESOLVED",
        "CLOSED",
      ];

      if (!status) {
        return res.status(400).json({
          success: false,
          message:
            "status is required",
        });
      }

      if (
        !validStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid emergency status",
        });
      }

      const existingEmergency =
        await prisma.emergency.findUnique({
          where: {
            id,
          },
        });

      if (!existingEmergency) {
        return res.status(404).json({
          success: false,
          message:
            "Emergency not found",
        });
      }

      const now = new Date();

      const result =
        await prisma.$transaction(
          async (tx) => {
            const emergency =
              await tx.emergency.update({
                where: {
                  id,
                },

                data: {
                  status,

                  ...(status !==
                    "ACTIVE" && {
                    handledById:
                      req.user.userId,
                  }),

                  ...(status ===
                    "RESOLVED" && {
                    resolvedAt: now,
                  }),

                  ...(status ===
                    "CLOSED" &&
                    !existingEmergency.resolvedAt && {
                      resolvedAt: now,
                    }),
                },
              });

            // Keep the related HealthRequest in sync.
            let healthStatus;

            switch (status) {
              case "ACTIVE":
                healthStatus =
                  "REPORTED";
                break;

              case "ACKNOWLEDGED":
                healthStatus =
                  "ACKNOWLEDGED";
                break;

              case "RESOLVED":
                healthStatus =
                  "RESOLVED";
                break;

              case "CLOSED":
                healthStatus =
                  "CLOSED";
                break;

              default:
                healthStatus =
                  "REPORTED";
            }

            await tx.healthRequest.update({
              where: {
                id: existingEmergency.healthRequestId,
              },
              data: {
                status: healthStatus,

                ...(status !==
                  "ACTIVE" && {
                  handledById:
                    req.user.userId,
                }),

                ...(status ===
                  "RESOLVED" && {
                  resolvedAt: now,
                }),

                ...(status ===
                  "CLOSED" &&
                  !existingEmergency.resolvedAt && {
                    resolvedAt: now,
                  }),
              },
            });

            return emergency;
          }
        );

      const updatedEmergency =
        await prisma.emergency.findUnique({
          where: {
            id: result.id,
          },

          include: {
            healthRequest: true,

            handledBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },

            parentNotifications: {
              include: {
                parentContact: true,
              },
            },
          },
        });

      return res.status(200).json({
        success: true,
        message:
          "Emergency status updated successfully",
        data: updatedEmergency,
      });
    } catch (error) {
      console.error(
        "Update emergency status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update emergency status",
      });
    }
  };

module.exports = {
  createEmergency,
  getMyEmergencies,
  getEmergencies,
  getEmergencyById,
  updateEmergencyStatus,
};