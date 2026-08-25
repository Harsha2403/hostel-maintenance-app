const express = require("express");
const cors = require("cors");
const prisma = require("./config/prisma");

const authRoutes = require("./routes/auth.routes");
const testRoutes = require("./routes/test.routes");
const collegeRoutes = require("./routes/college.routes");
const hostelBuildingRoutes = require("./routes/hostelBuilding.routes");
const blockRoutes = require("./routes/block.routes");
const floorRoutes = require("./routes/floor.routes");
const roomRoutes = require("./routes/room.routes");
const studentRoutes = require("./routes/student.routes");
const parentContactRoutes = require("./routes/parentContact.routes");
const roomAllocationRoutes = require("./routes/roomAllocation.routes");
const complaintCategoryRoutes = require("./routes/complaintCategory.routes");
const complaintRoutes = require("./routes/complaint.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "Hostel Maintenance API and database are running"
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      success: false,
      message: "API is running, but database connection failed"
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/hostel-buildings", hostelBuildingRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/floors", floorRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/parent-contacts", parentContactRoutes);
app.use("/api/room-allocations", roomAllocationRoutes);
app.use("/api/complaint-categories", complaintCategoryRoutes);
app.use("/api/complaints", complaintRoutes);

module.exports = app;