require("dotenv").config();

const bcrypt = require("bcrypt");
const prisma = require("../src/config/prisma");

async function createAdmin() {
  try {
    const email = "admin@hostel.com";
    const password = "Admin@123";

    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      console.log("Admin user already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: "Hostel",
        lastName: "Admin",
        role: "ADMIN"
      }
    });

    console.log("Admin created successfully:");
    console.log({
      id: admin.id,
      email: admin.email,
      role: admin.role
    });
  } catch (error) {
    console.error("Failed to create admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();