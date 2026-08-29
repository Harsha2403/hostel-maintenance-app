require("dotenv").config();

const prisma = require("../src/config/prisma");

async function main() {
  const user = await prisma.user.update({
    where: {
      email: "maintenance@hostel.com",
    },
    data: {
      role: "MAINTENANCE_STAFF",
    },
  });

  console.log("User role updated successfully:");
  console.log({
    email: user.email,
    role: user.role,
  });
}

main()
  .catch((error) => {
    console.error("Error updating user:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });