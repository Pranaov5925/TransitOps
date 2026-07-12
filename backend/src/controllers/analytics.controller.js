const db = require("../config/database");

async function vehicleCosts(_req, res) {
  try {
    const [vehicles] = await db.query("SELECT id, regNumber, model FROM vehicles");
    const [fuel] = await db.query("SELECT vehicleId, cost FROM fuel_logs");
    const [maint] = await db.query("SELECT vehicleId, cost FROM maintenance_logs");
    const [exps] = await db.query("SELECT vehicleId, amount FROM expenses");

    const rows = vehicles.map((v) => {
      const fuelCost = fuel.filter((f) => f.vehicleId === v.id).reduce((a, b) => a + b.cost, 0);
      const maintCost = maint.filter((m) => m.vehicleId === v.id).reduce((a, b) => a + b.cost, 0);
      const otherExp = exps.filter((e) => e.vehicleId === v.id).reduce((a, b) => a + b.amount, 0);
      return {
        vehicleId: v.id,
        regNumber: v.regNumber,
        model: v.model,
        fuelCost,
        maintenanceCost: maintCost,
        otherExpenses: otherExp,
        totalOperationalCost: fuelCost + maintCost + otherExp,
      };
    });
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function fuelEfficiency(_req, res) {
  try {
    const [vehicles] = await db.query("SELECT id, regNumber, model FROM vehicles");
    const [fuel] = await db.query("SELECT vehicleId, liters FROM fuel_logs");
    const [trips] = await db.query(
      "SELECT vehicleId, distanceKm FROM trips WHERE `status` = 'Completed'",
    );

    const rows = vehicles.map((v) => {
      const totalLiters = fuel
        .filter((f) => f.vehicleId === v.id)
        .reduce((a, b) => a + b.liters, 0);
      const distance = trips
        .filter((t) => t.vehicleId === v.id)
        .reduce((a, b) => a + b.distanceKm, 0);
      const efficiency = totalLiters > 0 ? distance / totalLiters : 0;
      return {
        vehicleId: v.id,
        regNumber: v.regNumber,
        model: v.model,
        distanceKm: distance,
        totalLiters,
        efficiency: parseFloat(efficiency.toFixed(2)),
      };
    });
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function roi(_req, res) {
  try {
    const [vehicles] = await db.query("SELECT id, regNumber, model, cost, revenue FROM vehicles");
    const [fuel] = await db.query("SELECT vehicleId, cost FROM fuel_logs");
    const [maint] = await db.query("SELECT vehicleId, cost FROM maintenance_logs");
    const [trips] = await db.query(
      "SELECT vehicleId, distanceKm FROM trips WHERE `status` = 'Completed'",
    );

    const rows = vehicles.map((v) => {
      const fuelCost = fuel.filter((f) => f.vehicleId === v.id).reduce((a, b) => a + b.cost, 0);
      const maintCost = maint.filter((m) => m.vehicleId === v.id).reduce((a, b) => a + b.cost, 0);
      const distance = trips
        .filter((t) => t.vehicleId === v.id)
        .reduce((a, b) => a + b.distanceKm, 0);
      const revenue = v.revenue > 0 ? v.revenue : distance * 40;
      const roiVal = v.cost > 0 ? (revenue - (maintCost + fuelCost)) / v.cost : 0;
      return {
        vehicleId: v.id,
        regNumber: v.regNumber,
        model: v.model,
        revenue,
        fuelCost,
        maintenanceCost: maintCost,
        vehicleCost: v.cost,
        roi: parseFloat(roiVal.toFixed(4)),
      };
    });
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function exportCsv(_req, res) {
  try {
    const [vehicles] = await db.query("SELECT id, regNumber, cost, revenue FROM vehicles");
    const [fuel] = await db.query("SELECT vehicleId, liters, cost FROM fuel_logs");
    const [maint] = await db.query("SELECT vehicleId, cost FROM maintenance_logs");
    const [trips] = await db.query(
      "SELECT vehicleId, distanceKm FROM trips WHERE `status` = 'Completed'",
    );

    const header = [
      "Vehicle",
      "Distance km",
      "Fuel L",
      "Fuel ₹",
      "Maint ₹",
      "Efficiency km/L",
      "ROI %",
    ];
    const csvRows = [header.join(",")];

    vehicles.forEach((v) => {
      const vFuel = fuel.filter((f) => f.vehicleId === v.id);
      const totalLiters = vFuel.reduce((a, b) => a + b.liters, 0);
      const fuelCost = vFuel.reduce((a, b) => a + b.cost, 0);
      const maintCost = maint.filter((m) => m.vehicleId === v.id).reduce((a, b) => a + b.cost, 0);
      const distance = trips
        .filter((t) => t.vehicleId === v.id)
        .reduce((a, b) => a + b.distanceKm, 0);
      const efficiency = totalLiters > 0 ? distance / totalLiters : 0;
      const revenue = v.revenue > 0 ? v.revenue : distance * 40;
      const roiVal = v.cost > 0 ? (revenue - (fuelCost + maintCost)) / v.cost : 0;
      csvRows.push(
        [
          v.regNumber,
          distance,
          totalLiters,
          fuelCost,
          maintCost,
          efficiency.toFixed(2),
          (roiVal * 100).toFixed(1),
        ].join(","),
      );
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=transitops-report.csv");
    return res.send(csvRows.join("\n"));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { vehicleCosts, fuelEfficiency, roi, exportCsv };
