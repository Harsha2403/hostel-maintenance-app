const prisma = require("../config/prisma");

// Create college
const createCollege = async (req, res) => {
  try {
    const { name, address, email, phone } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "College name is required"
      });
    }

    const college = await prisma.college.create({
      data: {
        name,
        address,
        email,
        phone
      }
    });

    return res.status(201).json({
      success: true,
      message: "College created successfully",
      data: college
    });
  } catch (error) {
    console.error("Create college error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create college"
    });
  }
};


// Get all colleges
const getColleges = async (req, res) => {
  try {
    const colleges = await prisma.college.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({
      success: true,
      data: colleges
    });
  } catch (error) {
    console.error("Get colleges error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch colleges"
    });
  }
};


// Get college by ID
const getCollegeById = async (req, res) => {
  try {
    const { id } = req.params;

    const college = await prisma.college.findUnique({
      where: {
        id
      }
    });

    if (!college) {
      return res.status(404).json({
        success: false,
        message: "College not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: college
    });
  } catch (error) {
    console.error("Get college error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch college"
    });
  }
};


// Update college
const updateCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, email, phone, isActive } = req.body;

    const existingCollege = await prisma.college.findUnique({
      where: {
        id
      }
    });

    if (!existingCollege) {
      return res.status(404).json({
        success: false,
        message: "College not found"
      });
    }

    const college = await prisma.college.update({
      where: {
        id
      },
      data: {
        name,
        address,
        email,
        phone,
        isActive
      }
    });

    return res.status(200).json({
      success: true,
      message: "College updated successfully",
      data: college
    });
  } catch (error) {
    console.error("Update college error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update college"
    });
  }
};

module.exports = {
  createCollege,
  getColleges,
  getCollegeById,
  updateCollege
};