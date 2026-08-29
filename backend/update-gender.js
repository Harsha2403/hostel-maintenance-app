require("dotenv").config();

const prisma = require("./src/config/prisma");

async function main() {
 const updates = [
  {
    studentNumber: "STU333",
    gender: "FEMALE",
  },
  {
    studentNumber: "STU421",
    gender: "MALE",
  },
  {
    studentNumber: "STU420",
    gender: "MALE",
  },
  {
    studentNumber: "STU00111",
    gender: "MALE",
  },
  {
    studentNumber: "STU001",
    gender: "MALE",
  },
  {
    studentNumber: "STU0003",
    gender: "MALE",
  },
  {
    studentNumber: "STU0002",
    gender: "FEMALE",
  },
];

  for (const student of updates) {
    const existing = await prisma.student.findUnique({
      where: {
        studentNumber: student.studentNumber,
      },
    });

    if (!existing) {
      console.log(
        `❌ Student not found: ${student.studentNumber}`
      );
      continue;
    }

    const updated = await prisma.student.update({
      where: {
        studentNumber: student.studentNumber,
      },
      data: {
        gender: student.gender,
      },
    });

    console.log(
      `✅ ${updated.studentNumber} → ${updated.gender}`
    );
  }
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
