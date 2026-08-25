const prisma = require("../config/prisma");

// Create a hostel building
const createHostelBuilding = async (req, res) => {
  try {
    const { collegeId, name, code, description } = req.body;

    if (!collegeId || !name || !code) {
      return res.status(400).json({
        success: false,
        message: "College ID, building name, and building code are required"
      });
    }

    const college = await prisma.college.findUnique({
      where: {
        id: collegeId
      }
    });

    if (!college) {
      return res.status(404).json({
        success: false,
        message: "College not found"
      });
    }

    const existingBuilding = await prisma.hostelBuilding.findFirst({
      where: {
        collegeId,
        code
      }
    });

    if (existingBuilding) {
      return res.status(409).json({
        success: false,
        message: "A hostel building with this code already exists"
      });
    }

    const hostelBuilding = await prisma.hostelBuilding.create({
      data: {
        collegeId,
        name,
        code,
        description
      }
    });

    return res.status(201).json({
      success: true,
      message: "Hostel building created successfully",
      data: hostelBuilding
    });

  } catch (error) {
    console.error("Create hostel building error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create hostel building"
    });
  }
};


// Get all hostel buildings
const getHostelBuildings = async (req, res) => {
  try {
    const { collegeId } = req.query;

    const where = {};

    if (collegeId) {
      where.collegeId = collegeId;
    }

    const hostelBuildings = await prisma.hostelBuilding.findMany({
      where,
      include: {
        college: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({
      success: true,
      data: hostelBuildings
    });

  } catch (error) {
    console.error("Get hostel buildings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hostel buildings"
    });
  }
};


// Get hostel building by ID
const getHostelBuildingById = async (req, res) => {
  try {
    const { id } = req.params;

    const hostelBuilding = await prisma.hostelBuilding.findUnique({
      where: {
        id
      },
      include: {
        college: {
          select: {
            id: true,
            name: true
          }
        },
        blocks: true
      }
    });

    if (!hostelBuilding) {
      return res.status(404).json({
        success: false,
        message: "Hostel building not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: hostelBuilding
    });

  } catch (error) {
    console.error("Get hostel building error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hostel building"
    });
  }
};


// Update hostel building
const updateHostelBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, isActive } = req.body;

    const existingBuilding = await prisma.hostelBuilding.findUnique({
      where: {
        id
      }
    });

    if (!existingBuilding) {
      return res.status(404).json({
        success: false,
        message: "Hostel building not found"
      });
    }

    const hostelBuilding = await prisma.hostelBuilding.update({
      where: {
        id
      },
      data: {
        name,
        code,
        description,
        isActive
      }
    });

    return res.status(200).json({
      success: true,
      message: "Hostel building updated successfully",
      data: hostelBuilding
    });

  } catch (error) {
    console.error("Update hostel building error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update hostel building"
    });
  }
};


module.exports = {
  createHostelBuilding,
  getHostelBuildings,
  getHostelBuildingById,
  updateHostelBuilding
};