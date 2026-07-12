const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

async function getAll(req, res) {
  try {
    const { vehicleId } = req.query;
    let sql =
      "SELECT id, vehicleId, `type`, cost, `date`, `status` FROM maintenance_logs WHERE 1=1";
    const params = [];
    if (vehicleId) {
      sql += " AND vehicleId = ?";
      params.push(vehicleId);
    }
    sql += " ORDER BY createdAt ASC";
    const [rows] = await db.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function create(req, res) {
  try {
    const { vehicleId, type, cost, date, status } = req.body;
    const id = uuidv4();
    const st = status || "Open";
    if (cost !== undefined && Number(cost) < 0)
      return res.status(400).json({ error: "Maintenance cost cannot be negative." });

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        "INSERT INTO maintenance_logs (id, vehicleId, `type`, cost, `date`, `status`) VALUES (?,?,?,?,?,?)",
        [id, vehicleId, type, cost, date, st],
      );
      if (st === "Open") {
        await conn.query("UPDATE vehicles SET `status` = ? WHERE id = ?", ["In Shop", vehicleId]);
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    const [rows] = await db.query(
      "SELECT id, vehicleId, `type`, cost, `date`, `status` FROM maintenance_logs WHERE id = ?",
      [id],
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function close(req, res) {
  try {
    const { id } = req.params;
    const [recs] = await db.query("SELECT * FROM maintenance_logs WHERE id = ?", [id]);
    if (recs.length === 0) return res.status(404).json({ error: "Maintenance log not found." });
    const rec = recs[0];

    const [vehs] = await db.query("SELECT * FROM vehicles WHERE id = ?", [rec.vehicleId]);
    const veh = vehs[0];

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("UPDATE maintenance_logs SET `status` = ? WHERE id = ?", ["Closed", id]);
      if (veh && veh.status !== "Retired") {
        await conn.query("UPDATE vehicles SET `status` = ? WHERE id = ?", [
          "Available",
          rec.vehicleId,
        ]);
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { getAll, create, close };
