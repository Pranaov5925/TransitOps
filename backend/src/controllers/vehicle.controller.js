const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));
}

async function getAll(req, res) {
  try {
    const { type, status, region, search } = req.query;
    let sql =
      "SELECT id, regNumber, model, `type`, capacityKg, odometer, cost, revenue, `status`, region, permitType, fastagBalance, pucExpiry, fcExpiry FROM vehicles WHERE 1=1";
    const params = [];
    if (type) {
      sql += " AND `type` = ?";
      params.push(type);
    }
    if (status) {
      sql += " AND `status` = ?";
      params.push(status);
    }
    if (region) {
      sql += " AND region = ?";
      params.push(region);
    }
    if (search) {
      sql += " AND (regNumber LIKE ? OR model LIKE ?)";
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
    const {
      regNumber,
      model,
      type,
      capacityKg,
      odometer,
      cost,
      status,
      region,
      permitType,
      fastagBalance,
      pucExpiry,
      fcExpiry,
    } = req.body;

    const targetStatus = status || "Available";
    if (capacityKg < 0) return res.status(400).json({ error: "Capacity cannot be negative." });
    if (odometer < 0) return res.status(400).json({ error: "Odometer cannot be negative." });
    if (cost < 0) return res.status(400).json({ error: "Cost cannot be negative." });
    if (fastagBalance !== undefined && fastagBalance < 0)
      return res.status(400).json({ error: "FASTag balance cannot be negative." });

    if (targetStatus === "Available" && (isExpired(pucExpiry) || isExpired(fcExpiry))) {
      return res.status(400).json({
        error: "Vehicle cannot be set to Available because its PUC or FC document has expired.",
      });
    }

    // Case-insensitive uniqueness — MySQL default collation handles this
    const [existing] = await db.query("SELECT id FROM vehicles WHERE regNumber = ?", [regNumber]);
    if (existing.length > 0)
      return res.status(409).json({ error: "Registration number must be unique." });

    const id = uuidv4();
    await db.query(
      "INSERT INTO vehicles (id, regNumber, model, `type`, capacityKg, odometer, cost, `status`, region, permitType, fastagBalance, pucExpiry, fcExpiry) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        id,
        regNumber,
        model,
        type,
        capacityKg,
        odometer,
        cost,
        targetStatus,
        region,
        permitType || "National",
        fastagBalance !== undefined ? fastagBalance : 5000,
        pucExpiry || "2027-07-12",
        fcExpiry || "2027-07-12",
      ],
    );
    const [rows] = await db.query(
      "SELECT id, regNumber, model, `type`, capacityKg, odometer, cost, revenue, `status`, region, permitType, fastagBalance, pucExpiry, fcExpiry FROM vehicles WHERE id = ?",
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

    const [existing] = await db.query("SELECT * FROM vehicles WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ error: "Vehicle not found." });
    const current = existing[0];

    const targetStatus = fields.status !== undefined ? fields.status : current.status;
    const targetPuc = fields.pucExpiry !== undefined ? fields.pucExpiry : current.pucExpiry;
    const targetFc = fields.fcExpiry !== undefined ? fields.fcExpiry : current.fcExpiry;

    if (targetStatus === "Available" && (isExpired(targetPuc) || isExpired(targetFc))) {
      return res.status(400).json({
        error: "Vehicle cannot be set to Available because its PUC or FC document has expired.",
      });
    }

    const keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ error: "No fields to update." });

    if (fields.capacityKg !== undefined && fields.capacityKg < 0)
      return res.status(400).json({ error: "Capacity cannot be negative." });
    if (fields.odometer !== undefined && fields.odometer < 0)
      return res.status(400).json({ error: "Odometer cannot be negative." });
    if (fields.cost !== undefined && fields.cost < 0)
      return res.status(400).json({ error: "Cost cannot be negative." });
    if (fields.revenue !== undefined && fields.revenue < 0)
      return res.status(400).json({ error: "Revenue cannot be negative." });
    if (fields.fastagBalance !== undefined && fields.fastagBalance < 0)
      return res.status(400).json({ error: "FASTag balance cannot be negative." });

    const setClauses = keys.map((k) => {
      const col = ["type", "status"].includes(k) ? `\`${k}\`` : k;
      return `${col} = ?`;
    });
    const values = keys.map((k) => fields[k]);
    values.push(id);

    const [result] = await db.query(
      `UPDATE vehicles SET ${setClauses.join(", ")} WHERE id = ?`,
      values,
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Vehicle not found." });

    const [rows] = await db.query(
      "SELECT id, regNumber, model, `type`, capacityKg, odometer, cost, revenue, `status`, region, permitType, fastagBalance, pucExpiry, fcExpiry FROM vehicles WHERE id = ?",
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
    const [result] = await db.query("DELETE FROM vehicles WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Vehicle not found." });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function recharge(req, res) {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than zero." });
    }

    const [existing] = await db.query("SELECT fastagBalance FROM vehicles WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Vehicle not found." });
    }

    const newBalance = (existing[0].fastagBalance || 0) + Number(amount);
    await db.query("UPDATE vehicles SET fastagBalance = ? WHERE id = ?", [newBalance, id]);

    return res.json({ id, fastagBalance: newBalance });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { getAll, create, update, remove, recharge };
