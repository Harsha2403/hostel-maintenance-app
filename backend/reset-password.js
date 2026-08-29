require("dotenv").config();

const bcrypt = require("bcrypt");
const prisma = require("./src/config/prisma");

async function resetPassword() {
  try {
    const email = "maintenance@hostel.com";
    const newPassword = "Maintenance@123";

    console.log(`Resetting password for ${email}...`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: {
        email,
      },
      data: {
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    console.log("\nPassword reset successful!");
    console.log(user);
    console.log(`\nEmail: ${email}`);
    console.log(`Password: ${newPassword}`);
  } catch (error) {
    console.error("Password reset failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();