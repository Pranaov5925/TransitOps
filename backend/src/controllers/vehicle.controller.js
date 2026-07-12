const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

async function getAll(req, res) {
  try {
    const { type, status, region, search } = req.query;
    let sql = "SELECT id, regNumber, model, `type`, capacityKg, odometer, cost, revenue, `status`, region FROM vehicles WHERE 1=1";
    const params = [];
    if (type) { sql += " AND `type` = ?"; params.push(type); }
    if (status) { sql += " AND `status` = ?"; params.push(status); }
    if (region) { sql += " AND region = ?"; params.push(region); }
    if (search) { sql += " AND (regNumber LIKE ? OR model LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
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
    const { regNumber, model, type, capacityKg, odometer, cost, status, region } = req.body;
    // Case-insensitive uniqueness — MySQL default collation handles this
    const [existing] = await db.query("SELECT id FROM vehicles WHERE regNumber = ?", [regNumber]);
    if (existing.length > 0) return res.status(409).json({ error: "Registration number must be unique." });

    const id = uuidv4();
    await db.query(
      "INSERT INTO vehicles (id, regNumber, model, `type`, capacityKg, odometer, cost, `status`, region) VALUES (?,?,?,?,?,?,?,?,?)",
      [id, regNumber, model, type, capacityKg, odometer, cost, status || "Available", region]
    );
    const [rows] = await db.query("SELECT id, regNumber, model, `type`, capacityKg, odometer, cost, revenue, `status`, region FROM vehicles WHERE id = ?", [id]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const fields = req.body;
    const keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ error: "No fields to update." });

    const setClauses = keys.map((k) => {
      const col = ["type", "status"].includes(k) ? `\`${k}\`` : k;
      return `${col} = ?`;
    });
    const values = keys.map((k) => fields[k]);
    values.push(id);

    const [result] = await db.query(`UPDATE vehicles SET ${setClauses.join(", ")} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Vehicle not found." });

    const [rows] = await db.query("SELECT id, regNumber, model, `type`, capacityKg, odometer, cost, revenue, `status`, region FROM vehicles WHERE id = ?", [id]);
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM vehicles WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Vehicle not found." });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { getAll, create, update, remove };
