const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

async function getAll(req, res) {
  try {
    const { status, search } = req.query;
    let sql =
      "SELECT id, name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore, `status` FROM drivers WHERE 1=1";
    const params = [];
    if (status) {
      sql += " AND `status` = ?";
      params.push(status);
    }
    if (search) {
      sql += " AND (name LIKE ? OR licenseNumber LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
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
    const { name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore, status } =
      req.body;
    const id = uuidv4();
    if (safetyScore !== undefined && (Number(safetyScore) < 0 || Number(safetyScore) > 100))
      return res.status(400).json({ error: "Safety score must be between 0 and 100." });
    await db.query(
      "INSERT INTO drivers (id, name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore, `status`) VALUES (?,?,?,?,?,?,?,?)",
      [
        id,
        name,
        licenseNumber,
        licenseCategory,
        licenseExpiry,
        contact,
        safetyScore,
        status || "Available",
      ],
    );
    const [rows] = await db.query(
      "SELECT id, name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore, `status` FROM drivers WHERE id = ?",
      [id],
    );
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
    if (
      fields.safetyScore !== undefined &&
      (Number(fields.safetyScore) < 0 || Number(fields.safetyScore) > 100)
    )
      return res.status(400).json({ error: "Safety score must be between 0 and 100." });

    const setClauses = keys.map((k) => {
      const col = k === "status" ? "`status`" : k;
      return `${col} = ?`;
    });
    const values = keys.map((k) => fields[k]);
    values.push(id);

    const [result] = await db.query(
      `UPDATE drivers SET ${setClauses.join(", ")} WHERE id = ?`,
      values,
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Driver not found." });

    const [rows] = await db.query(
      "SELECT id, name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore, `status` FROM drivers WHERE id = ?",
      [id],
    );
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM drivers WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Driver not found." });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { getAll, create, update, remove };
