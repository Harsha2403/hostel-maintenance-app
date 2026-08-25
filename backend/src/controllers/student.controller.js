const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");

// Create Student
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

    // Validate required fields
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

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Check if student number already exists
    const existingStudent = await prisma.student.findUnique({
      where: { studentNumber },
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "Student number already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User + Student in one transaction
    const student = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: "STUDENT",

        student: {
          create: {
            studentNumber,
            department,
            course,
            year,
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
    console.error("Create student error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create student",
    });
  }
};

// Get All Students
const getStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
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
    console.error("Get students error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch students",
    });
  }
};

// Get Student By ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
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
    console.error("Get student error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch student",
    });
  }
};

// Update Student
const updateStudent = async (req, res) => {
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

    const existingStudent = await prisma.student.findUnique({
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

    const student = await prisma.student.update({
      where: { id },

      data: {
        ...(department !== undefined && { department }),
        ...(course !== undefined && { course }),
        ...(year !== undefined && { year }),
        ...(status !== undefined && { status }),

        user: {
          update: {
            ...(firstName !== undefined && { firstName }),
            ...(lastName !== undefined && { lastName }),
            ...(phone !== undefined && { phone }),
            ...(isActive !== undefined && { isActive }),
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
    console.error("Update student error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update student",
    });
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
};