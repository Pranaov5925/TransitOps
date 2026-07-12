const db = require("../config/database");

async function getKpis(_req, res) {
  try {
    const [vehicles] = await db.query("SELECT `status` FROM vehicles");
    const [trips] = await db.query("SELECT `status` FROM trips");
    const [drivers] = await db.query("SELECT `status` FROM drivers");

    const active = vehicles.filter((v) => v.status !== "Retired").length;
    const available = vehicles.filter((v) => v.status === "Available").length;
    const inMaintenance = vehicles.filter((v) => v.status === "In Shop").length;
    const activeTrips = trips.filter((t) => t.status === "Dispatched").length;
    const pendingTrips = trips.filter((t) => t.status === "Draft").length;
    const driversOnDuty = drivers.filter((d) => d.status === "On Trip").length;
    const utilization = active ? Math.round(((active - available) / active) * 100) : 0;

    return res.json({ active, available, inMaintenance, activeTrips, pendingTrips, driversOnDuty, utilization });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { getKpis };
