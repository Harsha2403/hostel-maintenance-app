const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

// ==========================================
// Create Maintenance Staff
// ==========================================
const createMaintenanceStaff = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
    } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message:
          "email, password, firstName and lastName are required",
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create maintenance staff
    const staff = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: "MAINTENANCE_STAFF",
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Maintenance staff created successfully",
      data: staff,
    });
  } catch (error) {
    console.error("Create maintenance staff error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create maintenance staff",
    });
  }
};


// ==========================================
// Get All Maintenance Staff
// ==========================================
const getMaintenanceStaff = async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: "MAINTENANCE_STAFF",
        isActive: true,
      },

      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },

      orderBy: {
        firstName: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Get maintenance staff error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance staff",
    });
  }
};

// ==========================================
// Student Self Registration
// ==========================================

const studentRegister = async (req, res) => {
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

    const existingUser =
      await prisma.user.findUnique({
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
        message:
          "Student number already exists",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters",
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
              department:
                department || null,
              course: course || null,
              year:
                year !== undefined &&
                year !== null &&
                year !== ""
                  ? Number(year)
                  : null,

              // Self-registered students
              // must wait for Admin.
              status: "PENDING",
            },
          },
        },

        include: {
          student: true,
        },
      });

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Your account is waiting for Admin approval.",

      data: {
        id: student.id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        role: student.role,
        status: student.student.status,
      },
    });
  } catch (error) {
    console.error(
      "Student registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to register student",
    });
  }
};

// ==========================================
// Login
// ==========================================
// ==========================================
// Login
// ==========================================

const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },

        include: {
          student: true,
        },
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    if (!user.isActive) {

      // Give a useful message for rejected
      // or inactive accounts.

      if (
        user.role === "STUDENT" &&
        user.student?.status === "REJECTED"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your student registration has been rejected by the administrator.",
        });
      }

      return res.status(403).json({
        success: false,
        message:
          "This account is inactive",
      });
    }

    // ==========================================
    // STUDENT APPROVAL CHECK
    // ==========================================

    if (user.role === "STUDENT") {

      if (!user.student) {
        return res.status(403).json({
          success: false,
          message:
            "Student profile not found",
        });
      }

      if (
        user.student.status === "PENDING"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your registration is pending Admin approval.",
        });
      }

      if (
        user.student.status === "REJECTED"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your student registration has been rejected.",
        });
      }

      if (
        user.student.status !== "ACTIVE"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your student account is not active.",
        });
      }
    }

    // ==========================================
    // PASSWORD
    // ==========================================

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // ==========================================
    // JWT
    // ==========================================

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },

      process.env.JWT_SECRET,

      {
        expiresIn:
          process.env.JWT_EXPIRES_IN ||
          "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,

        ...(user.role === "STUDENT" && {
          studentStatus:
            user.student?.status,
        }),
      },
    });

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong during login",
    });
  }
};


module.exports = {
  login,
  studentRegister,
  createMaintenanceStaff,
  getMaintenanceStaff,
};
