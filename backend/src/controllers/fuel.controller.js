const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

async function getAll(_req, res) {
  try {
    const [rows] = await db.query("SELECT id, vehicleId, liters, cost, `date` FROM fuel_logs ORDER BY createdAt ASC");
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function create(req, res) {
  try {
    const { vehicleId, liters, cost, date } = req.body;
    const id = uuidv4();
    await db.query("INSERT INTO fuel_logs (id, vehicleId, liters, cost, `date`) VALUES (?,?,?,?,?)", [id, vehicleId, liters, cost, date]);
    const [rows] = await db.query("SELECT id, vehicleId, liters, cost, `date` FROM fuel_logs WHERE id = ?", [id]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { getAll, create };
