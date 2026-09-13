const prisma = require("../config/prisma");

// ============================================================
// STUDENT - CREATE HEALTH REQUEST
// ============================================================

const createHealthRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const {
      requestType,
      description,
      priority,
    } = req.body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    const validTypes = [
      "ILLNESS",
      "INJURY",
      "MEDICAL_ASSISTANCE",
      "EMERGENCY",
      "OTHER",
    ];

    const validPriorities = [
      "NORMAL",
      "HIGH",
      "EMERGENCY",
    ];

    if (!requestType || !description) {
      return res.status(400).json({
        success: false,
        message:
          "requestType and description are required",
      });
    }

    if (!validTypes.includes(requestType)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid health request type",
      });
    }

    const selectedPriority =
      priority || "NORMAL";

    if (
      !validPriorities.includes(
        selectedPriority
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid health priority",
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
    // CREATE HEALTH REQUEST
    // --------------------------------------------------------

    const healthRequest =
      await prisma.healthRequest.create({
        data: {
          studentId: student.id,
          requestType,
          description:
            String(description).trim(),
          priority: selectedPriority,
          status: "REPORTED",
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
        },
      });

    return res.status(201).json({
      success: true,
      message:
        "Health request submitted successfully",
      data: healthRequest,
    });
  } catch (error) {
    console.error(
      "Create health request error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create health request",
    });
  }
};

// ============================================================
// STUDENT - GET MY HEALTH REQUESTS
// ============================================================

const getMyHealthRequests = async (
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

    const requests =
      await prisma.healthRequest.findMany({
        where: {
          studentId: student.id,
        },
        include: {
          emergency: true,
          handledBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: {
          reportedAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error(
      "Get my health requests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch health requests",
    });
  }
};

// ============================================================
// ADMIN / WARDEN - GET ALL HEALTH REQUESTS
// ============================================================

const getHealthRequests = async (
  req,
  res
) => {
  try {
    const requests =
      await prisma.healthRequest.findMany({
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

          emergency: true,

          handledBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },

        orderBy: {
          reportedAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error(
      "Get health requests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch health requests",
    });
  }
};

// ============================================================
// ADMIN / WARDEN - GET SINGLE HEALTH REQUEST
// ============================================================

const getHealthRequestById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const request =
      await prisma.healthRequest.findUnique({
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

          emergency: {
            include: {
              parentNotifications: true,
            },
          },

          handledBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

    if (!request) {
      return res.status(404).json({
        success: false,
        message:
          "Health request not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error(
      "Get health request by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch health request",
    });
  }
};

// ============================================================
// ADMIN / WARDEN - UPDATE HEALTH REQUEST STATUS
// ============================================================

const updateHealthRequestStatus =
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        status,
        remarks,
      } = req.body;

      const validStatuses = [
        "REPORTED",
        "ACKNOWLEDGED",
        "IN_PROGRESS",
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
            "Invalid health request status",
        });
      }

      const existingRequest =
        await prisma.healthRequest.findUnique({
          where: {
            id,
          },
        });

      if (!existingRequest) {
        return res.status(404).json({
          success: false,
          message:
            "Health request not found",
        });
      }

      const now = new Date();

      const updatedRequest =
        await prisma.$transaction(
          async (tx) => {
            const updated =
              await tx.healthRequest.update({
                where: {
                  id,
                },

                data: {
                  status,

                  ...(status !==
                    "REPORTED" && {
                    handledById:
                      req.user.userId,
                  }),

                  ...(status ===
                    "RESOLVED" && {
                    resolvedAt: now,
                  }),

                  ...(status ===
                    "CLOSED" &&
                    !existingRequest.resolvedAt && {
                      resolvedAt: now,
                    }),
                },

                include: {
                  emergency: true,
                  handledBy: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      role: true,
                    },
                  },
                },
              });

            return updated;
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "Health request status updated successfully",
        data: updatedRequest,
        remarks:
          remarks
            ? String(remarks).trim()
            : null,
      });
    } catch (error) {
      console.error(
        "Update health request status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update health request status",
      });
    }
  };

module.exports = {
  createHealthRequest,
  getMyHealthRequests,
  getHealthRequests,
  getHealthRequestById,
  updateHealthRequestStatus,
};