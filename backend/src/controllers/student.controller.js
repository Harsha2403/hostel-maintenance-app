const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");

// ==========================================================
// CREATE STUDENT
// ADMIN ONLY
//
// Existing Admin-created students remain ACTIVE by default.
// ==========================================================

const createStudent = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      studentNumber,
      department,
      course,
      year,
    } = req.body;

    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !studentNumber
    ) {
      return res.status(400).json({
        success: false,
        message:
          "email, password, firstName, lastName and studentNumber are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const existingStudent =
      await prisma.student.findUnique({
        where: { studentNumber },
      });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "Student number already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const student =
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || null,
          role: "STUDENT",

          student: {
            create: {
              studentNumber,
              department: department || null,
              course: course || null,
              year:
                year !== undefined &&
                year !== null &&
                year !== ""
                  ? Number(year)
                  : null,

              // Admin-created student
              // remains ACTIVE.
              status: "ACTIVE",
            },
          },
        },

        include: {
          student: true,
        },
      });

    return res.status(201).json({
      success: true,
      message: "Student created successfully",

      data: {
        id: student.id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone,
        role: student.role,
        student: student.student,
      },
    });
  } catch (error) {
    console.error(
      "Create student error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create student",
    });
  }
};


// ==========================================================
// GET ALL STUDENTS
// ADMIN / WARDEN
// ==========================================================

const getStudents = async (req, res) => {
  try {
    const students =
      await prisma.student.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
            },
          },

          roomAllocations: {
            where: {
              status: "ACTIVE",
            },

            include: {
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
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error(
      "Get students error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch students",
    });
  }
};


// ==========================================================
// GET PENDING STUDENTS
// ADMIN / WARDEN
// ==========================================================

const getPendingStudents = async (
  req,
  res
) => {
  try {
    const students =
      await prisma.student.findMany({
        where: {
          status: "PENDING",
        },

        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error(
      "Get pending students error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch pending students",
    });
  }
};


// ==========================================================
// APPROVE STUDENT
// ADMIN ONLY
// ==========================================================

const approveStudent = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const student =
      await prisma.student.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (student.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending students can be approved",
      });
    }

    const updatedStudent =
      await prisma.student.update({
        where: { id },

        data: {
          status: "ACTIVE",

          user: {
            update: {
              isActive: true,
            },
          },
        },

        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
              role: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Student approved successfully",
      data: updatedStudent,
    });
  } catch (error) {
    console.error(
      "Approve student error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to approve student",
    });
  }
};


// ==========================================================
// REJECT STUDENT
// ADMIN ONLY
// ==========================================================

const rejectStudent = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const student =
      await prisma.student.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (student.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending students can be rejected",
      });
    }

    const updatedStudent =
      await prisma.student.update({
        where: { id },

        data: {
          status: "REJECTED",

          user: {
            update: {
              isActive: false,
            },
          },
        },

        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
              role: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Student registration rejected",
      data: updatedStudent,
    });
  } catch (error) {
    console.error(
      "Reject student error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to reject student",
    });
  }
};

// ==========================================================
// GET LOGGED-IN STUDENT PROFILE
// STUDENT ONLY
// ==========================================================

const getMyStudentProfile = async (req, res) => {
  try {
    // The JWT middleware should place the logged-in user's ID here
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const student = await prisma.student.findUnique({
      where: {
        userId: userId,
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            role: true,
          },
        },

        roomAllocations: {
          where: {
            status: "ACTIVE",
          },

          orderBy: {
            allocatedAt: "desc",
          },

          take: 1,

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
        },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Get my student profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch student profile",
    });
  }
};

// ==========================================================
// GET STUDENT BY ID
// ==========================================================

const getStudentById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const student =
      await prisma.student.findUnique({
        where: { id },

        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
              role: true,
            },
          },

          parentContacts: true,

          roomAllocations: {
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
          },

          complaints: true,
        },
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error(
      "Get student error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch student",
    });
  }
};


// ==========================================================
// UPDATE STUDENT
// ADMIN ONLY
// ==========================================================

const updateStudent = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      firstName,
      lastName,
      phone,
      department,
      course,
      year,
      status,
      isActive,
    } = req.body;

    const existingStudent =
      await prisma.student.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const student =
      await prisma.student.update({
        where: { id },

        data: {
          ...(department !== undefined && {
            department,
          }),

          ...(course !== undefined && {
            course,
          }),

          ...(year !== undefined && {
            year:
              year === null ||
              year === ""
                ? null
                : Number(year),
          }),

          ...(status !== undefined && {
            status,
          }),

          user: {
            update: {
              ...(firstName !== undefined && {
                firstName,
              }),

              ...(lastName !== undefined && {
                lastName,
              }),

              ...(phone !== undefined && {
                phone,
              }),

              ...(isActive !== undefined && {
                isActive,
              }),
            },
          },
        },

        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (error) {
    console.error(
      "Update student error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update student",
    });
  }
};


module.exports = {
  createStudent,
  getStudents,
  getPendingStudents,
  approveStudent,
  rejectStudent,
  getStudentById,
  getMyStudentProfile,
  updateStudent,
};