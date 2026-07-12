require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const vehicleRoutes = require("./routes/vehicle.routes");
const driverRoutes = require("./routes/driver.routes");
const tripRoutes = require("./routes/trip.routes");
const maintenanceRoutes = require("./routes/maintenance.routes");
const fuelRoutes = require("./routes/fuel.routes");
const expenseRoutes = require("./routes/expense.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const rbacMiddleware = require("./middleware/rbac");

const app = express();
const PORT = process.env.PORT || 4000;

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(rbacMiddleware);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/auth", authRoutes);
app.use("/vehicles", vehicleRoutes);
app.use("/drivers", driverRoutes);
app.use("/trips", tripRoutes);
app.use("/maintenance-logs", maintenanceRoutes);
app.use("/fuel-logs", fuelRoutes);
app.use("/expenses", expenseRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/analytics", analyticsRoutes);

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚛 TransitOps API running on http://localhost:${PORT}`);
});
