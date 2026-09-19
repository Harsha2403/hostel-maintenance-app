const twilio = require("twilio");
const prisma = require("../config/prisma");

// ============================================================
// TWILIO CONFIG
// ============================================================

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid =
  process.env.TWILIO_VERIFY_SERVICE_SID;

if (!accountSid || !authToken || !verifyServiceSid) {
  console.warn(
    "Twilio Verify environment variables are not fully configured."
  );
}

const twilioClient =
  accountSid && authToken
    ? twilio(accountSid, authToken)
    : null;

// ============================================================
// HELPERS
// ============================================================

const normalizePhone = (phone) => {
  if (!phone) return "";

  const cleaned = String(phone)
    .trim()
    .replace(/[\s()-]/g, "");

  // Indian 10-digit number -> E.164
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // 91XXXXXXXXXX -> +91XXXXXXXXXX
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // Already E.164
  if (/^\+[1-9]\d{7,14}$/.test(cleaned)) {
    return cleaned;
  }

  return "";
};

const ensureTwilioConfigured = () => {
  if (!twilioClient || !verifyServiceSid) {
    const error = new Error(
      "Twilio Verify is not configured correctly."
    );

    error.statusCode = 500;

    throw error;
  }
};

// ============================================================
// START TWILIO VERIFICATION
// ============================================================

const sendParentOtp = async (phone) => {
  ensureTwilioConfigured();

  const verification =
    await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

  return verification;
};

// ============================================================
// CHECK TWILIO VERIFICATION
// ============================================================

const checkParentOtp = async (
  phone,
  code
) => {
  ensureTwilioConfigured();

  const verificationCheck =
    await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: phone,
        code,
      });

  return verificationCheck;
};

// ============================================================
// STUDENT: REQUEST NEW PARENT CONTACT
// ============================================================

const requestParentContact = async (
  req,
  res
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const {
      name,
      relationship,
      phone,
      email,
      isPrimary,
      isEmergencyContact,
    } = req.body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!name || !relationship || !phone) {
      return res.status(400).json({
        success: false,
        message:
          "name, relationship and phone are required",
      });
    }

    const normalizedPhone =
      normalizePhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid mobile number",
      });
    }

    // --------------------------------------------------------
    // GET LOGGED-IN STUDENT
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
        message: "Student profile not found",
      });
    }

    // --------------------------------------------------------
    // PREVENT DUPLICATE ACTIVE REQUEST
    // --------------------------------------------------------

    const existingContact =
      await prisma.parentContact.findFirst({
        where: {
          studentId: student.id,
          phone: normalizedPhone,
          status: {
            in: [
              "PENDING",
              "PHONE_VERIFIED",
              "APPROVED",
            ],
          },
        },
      });

    if (existingContact) {
      return res.status(409).json({
        success: false,
        message:
          "A parent contact with this mobile number already exists.",
        data: {
          parentContactId:
            existingContact.id,
          status:
            existingContact.status,
          phoneVerified:
            existingContact.phoneVerified,
        },
      });
    }

    // --------------------------------------------------------
    // CREATE PENDING PARENT CONTACT
    // --------------------------------------------------------

    const parentContact =
      await prisma.parentContact.create({
        data: {
          studentId: student.id,
          name: String(name).trim(),
          relationship:
            String(relationship).trim(),
          phone: normalizedPhone,
          email:
            email &&
            String(email).trim()
              ? String(email).trim()
              : null,

          isPrimary:
            Boolean(isPrimary),
          isEmergencyContact:
            Boolean(isEmergencyContact),

          phoneVerified: false,
          phoneVerifiedAt: null,

          status: "PENDING",
          approvedAt: null,
          approvedBy: null,
          rejectionReason: null,
        },
      });

    // --------------------------------------------------------
    // SEND REAL SMS OTP
    // --------------------------------------------------------

    try {
      const verification =
        await sendParentOtp(
          normalizedPhone
        );

      return res.status(201).json({
        success: true,
        message:
          "Parent contact request created. OTP sent to the parent's mobile number.",
        data: {
          parentContactId:
            parentContact.id,
          status:
            parentContact.status,
          phone: normalizedPhone,
          verificationStatus:
            verification.status,
        },
      });
    } catch (twilioError) {
      // If Twilio fails, remove the just-created
      // pending record so the student can retry cleanly.
      await prisma.parentContact.delete({
        where: {
          id: parentContact.id,
        },
      });

      throw twilioError;
    }
  } catch (error) {
    console.error(
      "Request parent contact error:",
      error
    );

    return res.status(
      error?.statusCode || 500
    ).json({
      success: false,
      message:
        error?.message ||
        "Failed to create parent contact request",
    });
  }
};

// ============================================================
// PARENT: VERIFY OTP
// ============================================================

const verifyParentOtp = async (
  req,
  res
) => {
  try {
    const {
      parentContactId,
      otp,
    } = req.body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!parentContactId || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "parentContactId and otp are required",
      });
    }

    const normalizedOtp =
      String(otp).trim();

    if (!/^\d{4,10}$/.test(normalizedOtp)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid OTP.",
      });
    }

    // --------------------------------------------------------
    // FIND PARENT CONTACT
    // --------------------------------------------------------

    const parentContact =
      await prisma.parentContact.findUnique({
        where: {
          id: parentContactId,
        },
      });

    if (!parentContact) {
      return res.status(404).json({
        success: false,
        message:
          "Parent contact request not found",
      });
    }

    if (
      parentContact.status ===
      "APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Parent contact is already approved.",
      });
    }

    if (
      parentContact.phoneVerified
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Parent mobile number is already verified.",
      });
    }

    // --------------------------------------------------------
    // VERIFY USING TWILIO
    // --------------------------------------------------------

    const verificationCheck =
      await checkParentOtp(
        parentContact.phone,
        normalizedOtp
      );

    if (
      verificationCheck.status !==
      "approved"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired OTP.",
      });
    }

    // --------------------------------------------------------
    // UPDATE DATABASE
    // --------------------------------------------------------

    const updatedContact =
      await prisma.parentContact.update({
        where: {
          id: parentContactId,
        },
        data: {
          phoneVerified: true,
          phoneVerifiedAt:
            new Date(),
          status:
            "PHONE_VERIFIED",
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Parent mobile number verified successfully. Waiting for Admin approval.",
      data: {
        parentContactId:
          updatedContact.id,
        phoneVerified:
          updatedContact.phoneVerified,
        status:
          updatedContact.status,
      },
    });
  } catch (error) {
    console.error(
      "Verify parent OTP error:",
      error
    );

    return res.status(
      error?.statusCode || 500
    ).json({
      success: false,
      message:
        error?.message ||
        "Failed to verify parent OTP",
    });
  }
};

// ============================================================
// STUDENT: RESEND OTP
// ============================================================

const resendParentOtp = async (
  req,
  res
) => {
  try {
    const {
      parentContactId,
    } = req.body;

    if (!parentContactId) {
      return res.status(400).json({
        success: false,
        message:
          "parentContactId is required",
      });
    }

    // --------------------------------------------------------
    // FIND CONTACT
    // --------------------------------------------------------

    const parentContact =
      await prisma.parentContact.findUnique({
        where: {
          id: parentContactId,
        },
      });

    if (!parentContact) {
      return res.status(404).json({
        success: false,
        message:
          "Parent contact not found",
      });
    }

    // --------------------------------------------------------
    // VERIFY OWNERSHIP
    // --------------------------------------------------------

    const student =
      await prisma.student.findUnique({
        where: {
          id: parentContact.studentId,
        },
      });

    if (
      !student ||
      student.userId !==
        req.user?.userId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to resend this OTP",
      });
    }

    // --------------------------------------------------------
    // CHECK STATUS
    // --------------------------------------------------------

    if (
      parentContact.status ===
      "APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This parent contact is already approved.",
      });
    }

    if (
      parentContact.phoneVerified
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Parent mobile number is already verified.",
      });
    }

    // --------------------------------------------------------
    // SEND NEW OTP
    // --------------------------------------------------------

    const verification =
      await sendParentOtp(
        parentContact.phone
      );

    return res.status(200).json({
      success: true,
      message:
        "A new OTP has been sent to the parent's mobile number.",
      data: {
        parentContactId,
        verificationStatus:
          verification.status,
      },
    });
  } catch (error) {
    console.error(
      "Resend parent OTP error:",
      error
    );

    return res.status(
      error?.statusCode || 500
    ).json({
      success: false,
      message:
        error?.message ||
        "Failed to resend parent OTP",
    });
  }
};

// ============================================================
// ADMIN: GET PENDING PARENT CONTACTS
// ============================================================

const getPendingParentContacts =
  async (req, res) => {
    try {
      const contacts =
        await prisma.parentContact.findMany({
          where: {
            status: {
              in: [
                "PENDING",
                "PHONE_VERIFIED",
              ],
            },
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
          orderBy: {
            createdAt: "desc",
          },
        });

      return res.status(200).json({
        success: true,
        count: contacts.length,
        data: contacts,
      });
    } catch (error) {
      console.error(
        "Get pending parent contacts error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch pending parent contacts",
      });
    }
  };

  // ============================================================
// ADMIN: GET ALL PARENT ACCOUNTS
// ============================================================

const getAllParentContacts = async (req, res) => {
  try {
    const contacts = await prisma.parentContact.findMany({
      where: {
        status: "APPROVED",
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

        parentUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error(
      "Get all parent contacts error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch parent accounts",
    });
  }
};

// ============================================================
// ADMIN: APPROVE PARENT CONTACT + CREATE PARENT ACCOUNT
// ============================================================

const approveParentContact = async (req, res) => {
  try {
    const { id } = req.params;

    const existingContact =
      await prisma.parentContact.findUnique({
        where: {
          id,
        },
      });

    if (!existingContact) {
      return res.status(404).json({
        success: false,
        message: "Parent contact not found",
      });
    }

    if (!existingContact.phoneVerified) {
      return res.status(400).json({
        success: false,
        message:
          "Parent mobile number must be verified before Admin approval.",
      });
    }

    if (existingContact.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        message:
          "Parent contact is already approved.",
      });
    }

    // --------------------------------------------------------
    // FIND EXISTING PARENT ACCOUNT
    // --------------------------------------------------------
    //
    // First try email because it is unique in users.
    // Then try phone, but only where role = PARENT.
    //
    let parentUser = null;

    if (existingContact.email) {
      parentUser =
        await prisma.user.findUnique({
          where: {
            email:
              existingContact.email
                .trim()
                .toLowerCase(),
          },
        });

      if (
        parentUser &&
        parentUser.role !== "PARENT"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "The parent's email is already associated with another user account.",
        });
      }
    }

    if (!parentUser && existingContact.phone) {
      parentUser =
        await prisma.user.findFirst({
          where: {
            phone: existingContact.phone,
            role: "PARENT",
          },
        });
    }

    // --------------------------------------------------------
    // CREATE / REUSE PARENT ACCOUNT
    // --------------------------------------------------------

    let temporaryPassword = null;

    const result =
      await prisma.$transaction(
        async (tx) => {
          // --------------------------------------------------
          // CREATE PARENT USER IF IT DOES NOT EXIST
          // --------------------------------------------------

          if (!parentUser) {
            const generatedPassword =
              require("crypto")
                .randomBytes(12)
                .toString("base64url");

            const bcrypt =
              require("bcrypt");

            const hashedPassword =
              await bcrypt.hash(
                generatedPassword,
                10
              );

            parentUser =
              await tx.user.create({
                data: {
                  email:
                    existingContact.email
                      ? existingContact.email
                          .trim()
                          .toLowerCase()
                      : `parent.${existingContact.phone.replace(
                          /\D/g,
                          ""
                        )}@hostel.local`,

                  password:
                    hashedPassword,

                  firstName:
                    existingContact.name
                      .trim()
                      .split(/\s+/)[0] ||
                    "Parent",

                  lastName:
                    existingContact.name
                      .trim()
                      .split(/\s+/)
                      .slice(1)
                      .join(" ") ||
                    "",

                  phone:
                    existingContact.phone,

                  role: "PARENT",

                  isActive: true,

                  mustChangePassword:
                    true,
                },
              });

            temporaryPassword =
              generatedPassword;
          } else {
            // Existing parent account may have
            // been deactivated previously.
            if (!parentUser.isActive) {
              parentUser =
                await tx.user.update({
                  where: {
                    id: parentUser.id,
                  },

                  data: {
                    isActive: true,
                  },
                });
            }
          }

          // --------------------------------------------------
          // PRIMARY CONTACT HANDLING
          // --------------------------------------------------

          if (existingContact.isPrimary) {
            await tx.parentContact.updateMany({
              where: {
                studentId:
                  existingContact.studentId,

                isPrimary: true,

                status: "APPROVED",

                NOT: {
                  id,
                },
              },

              data: {
                isPrimary: false,
              },
            });
          }

          // --------------------------------------------------
          // LINK CONTACT TO PARENT USER
          // --------------------------------------------------

          const updatedContact =
            await tx.parentContact.update({
              where: {
                id,
              },

              data: {
                parentUserId:
                  parentUser.id,

                status: "APPROVED",

                approvedAt:
                  new Date(),

                approvedBy:
                  req.user.userId,

                rejectionReason:
                  null,
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

                parentUser: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    mustChangePassword: true,
                  },
                },
              },
            });

          return updatedContact;
        }
      );

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        parentUser && temporaryPassword
          ? "Parent contact approved and parent account created successfully."
          : "Parent contact approved and linked to the existing parent account.",

      data: {
        parentContact: result,

        parentAccount: {
          id: result.parentUser.id,
          email: result.parentUser.email,
          phone: result.parentUser.phone,
          role: result.parentUser.role,
          isActive:
            result.parentUser.isActive,
          mustChangePassword:
            result.parentUser.mustChangePassword,
        },

        // IMPORTANT:
        // This is returned only once when the account
        // is initially created.
        temporaryPassword,
      },
    });
  } catch (error) {
    console.error(
      "Approve parent contact error:",
      error
    );

    // Handle duplicate email safely
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message:
          "A user account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to approve parent contact and create parent account.",
    });
  }
};

// ============================================================
// ADMIN: REJECT PARENT CONTACT
// ============================================================

const rejectParentContact =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      const {
        rejectionReason,
      } = req.body;

      const existingContact =
        await prisma.parentContact.findUnique({
          where: {
            id,
          },
        });

      if (!existingContact) {
        return res.status(404).json({
          success: false,
          message:
            "Parent contact not found",
        });
      }

      const updatedContact =
        await prisma.parentContact.update({
          where: {
            id,
          },
          data: {
            status:
              "REJECTED",
            rejectionReason:
              rejectionReason
                ? String(
                    rejectionReason
                  ).trim()
                : "Rejected by Admin",
            approvedAt: null,
            approvedBy: null,
          },
        });

      return res.status(200).json({
        success: true,
        message:
          "Parent contact rejected successfully",
        data: updatedContact,
      });
    } catch (error) {
      console.error(
        "Reject parent contact error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to reject parent contact",
      });
    }
  };

// ============================================================
// ADMIN / WARDEN: CREATE OFFICIAL CONTACT
// ============================================================

const createParentContact = async (
  req,
  res
) => {
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

    if (
      !studentId ||
      !name ||
      !relationship ||
      !phone
    ) {
      return res.status(400).json({
        success: false,
        message:
          "studentId, name, relationship and phone are required",
      });
    }

    const normalizedPhone =
      normalizePhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid mobile number",
      });
    }

    const student =
      await prisma.student.findUnique({
        where: {
          id: studentId,
        },
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student not found",
      });
    }

    const parentContact =
      await prisma.$transaction(
        async (tx) => {
          if (isPrimary === true) {
            await tx.parentContact.updateMany({
              where: {
                studentId,
                isPrimary: true,
              },
              data: {
                isPrimary: false,
              },
            });
          }

          return tx.parentContact.create({
            data: {
              studentId,
              name: String(name).trim(),
              relationship:
                String(
                  relationship
                ).trim(),
              phone:
                normalizedPhone,
              email:
                email &&
                String(email).trim()
                  ? String(email).trim()
                  : null,

              isPrimary:
                Boolean(isPrimary),
              isEmergencyContact:
                Boolean(
                  isEmergencyContact
                ),

              // Staff-created contacts are official.
              phoneVerified:
                true,
              phoneVerifiedAt:
                new Date(),
              status:
                "APPROVED",
              approvedAt:
                new Date(),
              approvedBy:
                req.user.userId,
              rejectionReason:
                null,
            },
          });
        }
      );

    return res.status(201).json({
      success: true,
      message:
        "Parent contact created successfully",
      data: parentContact,
    });
  } catch (error) {
    console.error(
      "Create parent contact error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create parent contact",
    });
  }
};

// ============================================================
// ADMIN / WARDEN: GET CONTACTS BY STUDENT
// ============================================================

const getParentContactsByStudent =
  async (req, res) => {
    try {
      const {
        studentId,
      } = req.params;

      const contacts =
        await prisma.parentContact.findMany({
          where: {
            studentId,
          },
          orderBy: [
            {
              status: "asc",
            },
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
      console.error(
        "Get parent contacts error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch parent contacts",
      });
    }
  };

// ============================================================
// ADMIN / WARDEN: UPDATE CONTACT
// ============================================================

const updateParentContact = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    const {
      name,
      relationship,
      phone,
      email,
      isPrimary,
      isEmergencyContact,
    } = req.body;

    const existingContact =
      await prisma.parentContact.findUnique({
        where: {
          id,
        },
      });

    if (!existingContact) {
      return res.status(404).json({
        success: false,
        message:
          "Parent contact not found",
      });
    }

    let normalizedPhone;

    if (phone !== undefined) {
      normalizedPhone =
        normalizePhone(phone);

      if (!normalizedPhone) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid mobile number",
        });
      }
    }

    if (isPrimary === true) {
      await prisma.parentContact.updateMany({
        where: {
          studentId:
            existingContact.studentId,
          isPrimary: true,
          NOT: {
            id,
          },
          status: "APPROVED",
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const updatedContact =
      await prisma.parentContact.update({
        where: {
          id,
        },
        data: {
          ...(name !== undefined && {
            name: String(
              name
            ).trim(),
          }),

          ...(relationship !==
            undefined && {
            relationship:
              String(
                relationship
              ).trim(),
          }),

          ...(phone !== undefined && {
            phone:
              normalizedPhone,

            phoneVerified:
              true,

            phoneVerifiedAt:
              new Date(),
          }),

          ...(email !== undefined && {
            email:
              email &&
              String(email).trim()
                ? String(email).trim()
                : null,
          }),

          ...(isPrimary !==
            undefined && {
            isPrimary,
          }),

          ...(isEmergencyContact !==
            undefined && {
            isEmergencyContact,
          }),

          status: "APPROVED",

          approvedAt:
            existingContact.approvedAt ||
            new Date(),

          approvedBy:
            existingContact.approvedBy ||
            req.user.userId,

          rejectionReason: null,
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Parent contact updated successfully",
      data: updatedContact,
    });
  } catch (error) {
    console.error(
      "Update parent contact error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update parent contact",
    });
  }
};

// ============================================================
// ADMIN ONLY: DELETE CONTACT
// ============================================================


const deleteParentContact = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find the parent contact
      const parentContact =
        await tx.parentContact.findUnique({
          where: {
            id,
          },
        });

      if (!parentContact) {
        throw new Error(
          "Parent contact not found."
        );
      }

      // 2. Get the parent user ID
      const parentUserId =
        parentContact.parentUserId;

      // 3. Delete ParentContact first
      await tx.parentContact.delete({
        where: {
          id,
        },
      });

      // 4. Delete the parent User account
      if (parentUserId) {
        await tx.user.delete({
          where: {
            id: parentUserId,
          },
        });
      }

      return {
        parentContactId: id,
        parentUserId,
      };
    });

    return res.status(200).json({
      success: true,
      message:
        "Parent contact and parent user account deleted successfully.",
      data: result,
    });
  } catch (error) {
    console.error(
      "Delete parent contact error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to delete parent contact.",
    });
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  requestParentContact,
  verifyParentOtp,
  resendParentOtp,

  getPendingParentContacts,
  approveParentContact,
  rejectParentContact,

  createParentContact,
  getParentContactsByStudent,
  updateParentContact,
  deleteParentContact,

  getAllParentContacts,
};