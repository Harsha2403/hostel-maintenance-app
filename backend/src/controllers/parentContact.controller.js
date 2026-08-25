const prisma = require("../config/prisma");

// Create Parent Contact
const createParentContact = async (req, res) => {
  try {
    const {
      studentId,
      name,
      relationship,
      phone,
      email,
      isPrimary,
      isEmergencyContact,
    } = req.body;

    // Required fields
    if (!studentId || !name || !relationship || !phone) {
      return res.status(400).json({
        success: false,
        message:
          "studentId, name, relationship and phone are required",
      });
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // If this contact is primary, remove primary status
    // from other contacts of the same student
    if (isPrimary === true) {
      await prisma.parentContact.updateMany({
        where: {
          studentId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const parentContact = await prisma.parentContact.create({
      data: {
        studentId,
        name,
        relationship,
        phone,
        email,
        isPrimary: isPrimary || false,
        isEmergencyContact: isEmergencyContact || false,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Parent contact created successfully",
      data: parentContact,
    });
  } catch (error) {
    console.error("Create parent contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create parent contact",
    });
  }
};


// Get Parent Contacts by Student ID
const getParentContactsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const contacts = await prisma.parentContact.findMany({
      where: {
        studentId,
      },
      orderBy: [
        {
          isPrimary: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error("Get parent contacts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch parent contacts",
    });
  }
};


// Update Parent Contact
const updateParentContact = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      relationship,
      phone,
      email,
      isPrimary,
      isEmergencyContact,
    } = req.body;

    const existingContact = await prisma.parentContact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      return res.status(404).json({
        success: false,
        message: "Parent contact not found",
      });
    }

    // If making this contact primary,
    // remove primary status from other contacts
    if (isPrimary === true) {
      await prisma.parentContact.updateMany({
        where: {
          studentId: existingContact.studentId,
          isPrimary: true,
          NOT: {
            id,
          },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const parentContact = await prisma.parentContact.update({
      where: { id },

      data: {
        ...(name !== undefined && { name }),
        ...(relationship !== undefined && { relationship }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(isPrimary !== undefined && { isPrimary }),
        ...(isEmergencyContact !== undefined && {
          isEmergencyContact,
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Parent contact updated successfully",
      data: parentContact,
    });
  } catch (error) {
    console.error("Update parent contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update parent contact",
    });
  }
};


// Delete Parent Contact
const deleteParentContact = async (req, res) => {
  try {
    const { id } = req.params;

    const existingContact = await prisma.parentContact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      return res.status(404).json({
        success: false,
        message: "Parent contact not found",
      });
    }

    await prisma.parentContact.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Parent contact deleted successfully",
    });
  } catch (error) {
    console.error("Delete parent contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete parent contact",
    });
  }
};


module.exports = {
  createParentContact,
  getParentContactsByStudent,
  updateParentContact,
  deleteParentContact,
};