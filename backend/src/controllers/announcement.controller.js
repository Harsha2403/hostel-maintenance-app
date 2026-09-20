const prisma = require("../config/prisma");

const ANNOUNCEMENT_AUDIENCES = [
  "ALL",
  "BOYS",
  "GIRLS",
  "SPECIFIC_BUILDING",
  "SPECIFIC_BLOCK",
];

const ANNOUNCEMENT_PRIORITIES = [
  "NORMAL",
  "IMPORTANT",
  "URGENT",
];

// ==========================================================
// VALIDATION
// ==========================================================

const validateAnnouncementInput = ({
  title,
  message,
  audience,
  priority,
  hostelBuildingId,
  blockId,
}) => {
  if (!title || !String(title).trim()) {
    return "Title is required.";
  }

  if (!message || !String(message).trim()) {
    return "Message is required.";
  }

  if (
    audience &&
    !ANNOUNCEMENT_AUDIENCES.includes(audience)
  ) {
    return "Invalid announcement audience.";
  }

  if (
    priority &&
    !ANNOUNCEMENT_PRIORITIES.includes(priority)
  ) {
    return "Invalid announcement priority.";
  }

  if (
    audience === "SPECIFIC_BUILDING" &&
    !hostelBuildingId
  ) {
    return "hostelBuildingId is required for SPECIFIC_BUILDING.";
  }

  if (
    audience === "SPECIFIC_BLOCK" &&
    !blockId
  ) {
    return "blockId is required for SPECIFIC_BLOCK.";
  }

  return null;
};

// ==========================================================
// COMMON INCLUDE
// ==========================================================

const announcementInclude = {
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },

  hostelBuilding: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },

  block: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
};

// ==========================================================
// GET ALL ANNOUNCEMENTS - ADMIN
// ==========================================================

const getAnnouncements = async (req, res) => {
  try {
    const announcements =
      await prisma.announcement.findMany({
        orderBy: [
          {
            isActive: "desc",
          },
          {
            createdAt: "desc",
          },
        ],

        include: announcementInclude,
      });

    return res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error(
      "Get announcements error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch announcements.",
    });
  }
};

// ==========================================================
// GET SINGLE ANNOUNCEMENT - ADMIN
// ==========================================================

const getAnnouncementById = async (
  req,
  res
) => {
  try {
    const announcement =
      await prisma.announcement.findUnique({
        where: {
          id: req.params.id,
        },

        include: announcementInclude,
      });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message:
          "Announcement not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error(
      "Get announcement error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch announcement.",
    });
  }
};

// ==========================================================
// VALIDATE BUILDING / BLOCK
// ==========================================================

const validateTarget = async (
  audience,
  hostelBuildingId,
  blockId,
  res
) => {
  if (
    audience === "SPECIFIC_BUILDING"
  ) {
    const building =
      await prisma.hostelBuilding.findUnique({
        where: {
          id: hostelBuildingId,
        },
      });

    if (!building) {
      res.status(404).json({
        success: false,
        message:
          "Hostel building not found.",
      });

      return false;
    }
  }

  if (
    audience === "SPECIFIC_BLOCK"
  ) {
    const block =
      await prisma.block.findUnique({
        where: {
          id: blockId,
        },
      });

    if (!block) {
      res.status(404).json({
        success: false,
        message:
          "Block not found.",
      });

      return false;
    }
  }

  return true;
};

// ==========================================================
// CREATE ANNOUNCEMENT - ADMIN
// ==========================================================

const createAnnouncement = async (
  req,
  res
) => {
  try {
    const {
      title,
      message,
      audience = "ALL",
      priority = "NORMAL",
      hostelBuildingId = null,
      blockId = null,
      expiresAt = null,
    } = req.body;

    const validationError =
      validateAnnouncementInput({
        title,
        message,
        audience,
        priority,
        hostelBuildingId,
        blockId,
      });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const targetValid =
      await validateTarget(
        audience,
        hostelBuildingId,
        blockId,
        res
      );

    if (!targetValid) {
      return;
    }

    const announcement =
      await prisma.announcement.create({
        data: {
          title: String(title).trim(),

          message: String(message).trim(),

          audience,

          priority,

          hostelBuildingId:
            audience ===
            "SPECIFIC_BUILDING"
              ? hostelBuildingId
              : null,

          blockId:
            audience ===
            "SPECIFIC_BLOCK"
              ? blockId
              : null,

          createdById:
            req.user.userId,

          isActive: true,

          expiresAt: expiresAt
            ? new Date(expiresAt)
            : null,
        },

        include: announcementInclude,
      });

    return res.status(201).json({
      success: true,

      message:
        "Announcement created successfully.",

      data: announcement,
    });
  } catch (error) {
    console.error(
      "Create announcement error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create announcement.",
    });
  }
};

// ==========================================================
// UPDATE ANNOUNCEMENT - ADMIN
// ==========================================================

const updateAnnouncement = async (
  req,
  res
) => {
  try {
    const existing =
      await prisma.announcement.findUnique({
        where: {
          id: req.params.id,
        },
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message:
          "Announcement not found.",
      });
    }

    const {
      title,
      message,
      audience,
      priority,
      hostelBuildingId,
      blockId,
      expiresAt,
      isActive,
    } = req.body;

    const nextAudience =
      audience !== undefined
        ? audience
        : existing.audience;

    const nextBuildingId =
      nextAudience ===
      "SPECIFIC_BUILDING"
        ? hostelBuildingId !== undefined
          ? hostelBuildingId
          : existing.hostelBuildingId
        : null;

    const nextBlockId =
      nextAudience ===
      "SPECIFIC_BLOCK"
        ? blockId !== undefined
          ? blockId
          : existing.blockId
        : null;

    const nextPriority =
      priority !== undefined
        ? priority
        : existing.priority;

    const validationError =
      validateAnnouncementInput({
        title:
          title !== undefined
            ? title
            : existing.title,

        message:
          message !== undefined
            ? message
            : existing.message,

        audience:
          nextAudience,

        priority:
          nextPriority,

        hostelBuildingId:
          nextBuildingId,

        blockId:
          nextBlockId,
      });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const targetValid =
      await validateTarget(
        nextAudience,
        nextBuildingId,
        nextBlockId,
        res
      );

    if (!targetValid) {
      return;
    }

    const data = {
      title:
        title !== undefined
          ? String(title).trim()
          : existing.title,

      message:
        message !== undefined
          ? String(message).trim()
          : existing.message,

      audience:
        nextAudience,

      priority:
        nextPriority,

      hostelBuildingId:
        nextBuildingId,

      blockId:
        nextBlockId,
    };

    if (expiresAt !== undefined) {
      data.expiresAt =
        expiresAt === null ||
        expiresAt === ""
          ? null
          : new Date(expiresAt);
    }

    if (isActive !== undefined) {
      data.isActive =
        Boolean(isActive);
    }

    const announcement =
      await prisma.announcement.update({
        where: {
          id: req.params.id,
        },

        data,

        include: announcementInclude,
      });

    return res.status(200).json({
      success: true,

      message:
        "Announcement updated successfully.",

      data: announcement,
    });
  } catch (error) {
    console.error(
      "Update announcement error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update announcement.",
    });
  }
};

// ==========================================================
// ACTIVATE / DEACTIVATE
// ==========================================================

const updateAnnouncementStatus = async (
  req,
  res
) => {
  try {
    if (
      typeof req.body.isActive !==
      "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "isActive must be true or false.",
      });
    }

    const announcement =
      await prisma.announcement.update({
        where: {
          id: req.params.id,
        },

        data: {
          isActive:
            req.body.isActive,
        },
      });

    return res.status(200).json({
      success: true,

      message:
        req.body.isActive
          ? "Announcement activated successfully."
          : "Announcement deactivated successfully.",

      data: announcement,
    });
  } catch (error) {
    console.error(
      "Update announcement status error:",
      error
    );

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message:
          "Announcement not found.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to update announcement status.",
    });
  }
};

// ==========================================================
// DELETE ANNOUNCEMENT
// ==========================================================

const deleteAnnouncement = async (
  req,
  res
) => {
  try {
    const existing =
      await prisma.announcement.findUnique({
        where: {
          id: req.params.id,
        },
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message:
          "Announcement not found.",
      });
    }

    await prisma.announcement.delete({
      where: {
        id: req.params.id,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Announcement deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete announcement error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete announcement.",
    });
  }
};

// ==========================================================
// STUDENT ANNOUNCEMENT CONTEXT
// ==========================================================

const getStudentAnnouncementContext =
  async (userId) => {
    const student =
      await prisma.student.findUnique({
        where: {
          userId,
        },

        select: {
          id: true,

          gender: true,

          roomAllocations: {
            where: {
              status: "ACTIVE",
            },

            orderBy: {
              allocatedAt: "desc",
            },

            take: 1,

            select: {
              room: {
                select: {
                  floor: {
                    select: {
                      block: {
                        select: {
                          id: true,
                          type: true,
                          hostelBuildingId:
                            true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!student) {
      return null;
    }

    const block =
      student.roomAllocations[0]
        ?.room?.floor?.block;

    return {
      student,

      gender:
        student.gender,

      buildingId:
        block?.hostelBuildingId ||
        null,

      blockId:
        block?.id || null,
    };
  };

// ==========================================================
// PARENT ANNOUNCEMENT CONTEXT
// ==========================================================

const getParentAnnouncementContext =
  async (userId) => {
    const contact =
      await prisma.parentContact.findFirst({
        where: {
          parentUserId: userId,

          status: "APPROVED",
        },

        orderBy: {
          updatedAt: "desc",
        },

        select: {
          student: {
            select: {
              id: true,

              gender: true,

              roomAllocations: {
                where: {
                  status: "ACTIVE",
                },

                orderBy: {
                  allocatedAt: "desc",
                },

                take: 1,

                select: {
                  room: {
                    select: {
                      floor: {
                        select: {
                          block: {
                            select: {
                              id: true,
                              hostelBuildingId:
                                true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!contact?.student) {
      return null;
    }

    const block =
      contact.student
        .roomAllocations[0]
        ?.room?.floor?.block;

    return {
      student:
        contact.student,

      gender:
        contact.student.gender,

      buildingId:
        block?.hostelBuildingId ||
        null,

      blockId:
        block?.id || null,
    };
  };

// ==========================================================
// AUDIENCE FILTER
// ==========================================================

const buildAudienceFilter = ({
  gender,
  buildingId,
  blockId,
}) => {
  const filters = [
    {
      audience: "ALL",
    },
  ];

  if (gender === "MALE") {
    filters.push({
      audience: "BOYS",
    });
  }

  if (gender === "FEMALE") {
    filters.push({
      audience: "GIRLS",
    });
  }

  if (buildingId) {
    filters.push({
      audience:
        "SPECIFIC_BUILDING",

      hostelBuildingId:
        buildingId,
    });
  }

  if (blockId) {
    filters.push({
      audience:
        "SPECIFIC_BLOCK",

      blockId,
    });
  }

  return filters;
};

// ==========================================================
// GET RELEVANT ANNOUNCEMENTS
// ==========================================================

const getRelevantAnnouncements =
  async (context) => {
    const now = new Date();

    return prisma.announcement.findMany({
      where: {
        isActive: true,

        AND: [
          {
            OR: [
              {
                expiresAt: null,
              },
              {
                expiresAt: {
                  gt: now,
                },
              },
            ],
          },

          {
            OR:
              buildAudienceFilter(
                context
              ),
          },
        ],
      },

      orderBy: [
        {
          priority: "desc",
        },

        {
          createdAt: "desc",
        },
      ],

      select: {
        id: true,
        title: true,
        message: true,
        audience: true,
        priority: true,
        hostelBuildingId: true,
        blockId: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  };

// ==========================================================
// GET STUDENT ANNOUNCEMENTS
// ==========================================================

const getStudentAnnouncements =
  async (req, res) => {
    try {
      const context =
        await getStudentAnnouncementContext(
          req.user.userId
        );

      if (!context) {
        return res.status(404).json({
          success: false,
          message:
            "Student profile not found.",
        });
      }

      const data =
        await getRelevantAnnouncements(
          context
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error(
        "Get student announcements error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch student announcements.",
      });
    }
  };

// ==========================================================
// GET PARENT ANNOUNCEMENTS
// ==========================================================

const getParentAnnouncements =
  async (req, res) => {
    try {
      const context =
        await getParentAnnouncementContext(
          req.user.userId
        );

      if (!context) {
        return res.status(404).json({
          success: false,
          message:
            "Approved parent contact/student association not found.",
        });
      }

      const data =
        await getRelevantAnnouncements(
          context
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error(
        "Get parent announcements error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch parent announcements.",
      });
    }
  };

// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  updateAnnouncementStatus,
  deleteAnnouncement,
  getStudentAnnouncements,
  getParentAnnouncements,
};