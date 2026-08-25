const prisma = require("../config/prisma");

// Create Complaint Category
const createComplaintCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const existingCategory = await prisma.complaintCategory.findUnique({
      where: {
        name: name.trim(),
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Complaint category already exists",
      });
    }

    const category = await prisma.complaintCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Complaint category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Create complaint category error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create complaint category",
    });
  }
};

// Get All Complaint Categories
const getComplaintCategories = async (req, res) => {
  try {
    const { active } = req.query;

    const where = {};

    if (active !== undefined) {
      where.isActive = active === "true";
    }

    const categories = await prisma.complaintCategory.findMany({
      where,
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Get complaint categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint categories",
    });
  }
};

// Get Complaint Category by ID
const getComplaintCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.complaintCategory.findUnique({
      where: { id },
      include: {
        complaints: true,
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Complaint category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get complaint category error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint category",
    });
  }
};

// Update Complaint Category
const updateComplaintCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const existingCategory = await prisma.complaintCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Complaint category not found",
      });
    }

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name cannot be empty",
      });
    }

    // Check duplicate name
    if (name && name.trim() !== existingCategory.name) {
      const duplicateCategory =
        await prisma.complaintCategory.findUnique({
          where: {
            name: name.trim(),
          },
        });

      if (duplicateCategory) {
        return res.status(409).json({
          success: false,
          message: "Complaint category name already exists",
        });
      }
    }

    const category = await prisma.complaintCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Complaint category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Update complaint category error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update complaint category",
    });
  }
};

module.exports = {
  createComplaintCategory,
  getComplaintCategories,
  getComplaintCategoryById,
  updateComplaintCategory,
};