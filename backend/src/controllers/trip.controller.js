const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

function toTripShape(t) {
  const obj = { id: t.id, code: t.code, source: t.source, destination: t.destination, vehicleId: t.vehicleId, driverId: t.driverId, cargoKg: t.cargoKg, distanceKm: t.distanceKm, status: t.status, createdAt: t.createdAt };
  if (t.fuelUsedL !== null && t.fuelUsedL !== undefined) obj.fuelUsedL = t.fuelUsedL;
  return obj;
}

async function nextTripCode() {
  const [rows] = await db.query("SELECT COUNT(*) AS cnt FROM trips");
  return `TR${String(rows[0].cnt + 1).padStart(3, "0")}`;
}

async function getAll(_req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM trips ORDER BY createdAt ASC");
    return res.json(rows.map(toTripShape));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function create(req, res) {
  try {
    const { source, destination, vehicleId, driverId, cargoKg, distanceKm } = req.body;

    const [vehs] = vehicleId ? await db.query("SELECT * FROM vehicles WHERE id = ?", [vehicleId]) : [[]];
    const [drvs] = driverId ? await db.query("SELECT * FROM drivers WHERE id = ?", [driverId]) : [[]];
    const veh = vehs[0];
    const drv = drvs[0];

    if (!veh || !drv) return res.json({ ok: false, error: "Vehicle and driver required." });
    if (veh.status === "Retired" || veh.status === "In Shop") return res.json({ ok: false, error: "Vehicle unavailable (In Shop or Retired)." });
    if (veh.status === "On Trip") return res.json({ ok: false, error: "Vehicle already on a trip." });
    if (drv.status === "On Trip") return res.json({ ok: false, error: "Driver already on a trip." });
    if (drv.status === "Suspended") return res.json({ ok: false, error: "Driver is suspended." });
    if (new Date(drv.licenseExpiry) < new Date()) return res.json({ ok: false, error: "Driver's license has expired." });
    if (cargoKg > veh.capacityKg) return res.json({ ok: false, error: `Cargo weight ${cargoKg} kg exceeds capacity ${veh.capacityKg} kg.` });

    const id = uuidv4();
    const code = await nextTripCode();
    const createdAt = new Date().toISOString().slice(0, 10);

    await db.query(
      "INSERT INTO trips (id, code, source, destination, vehicleId, driverId, cargoKg, distanceKm, `status`, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [id, code, source, destination, vehicleId, driverId, cargoKg, distanceKm, "Draft", createdAt]
    );

    const [rows] = await db.query("SELECT * FROM trips WHERE id = ?", [id]);
    return res.json({ ok: true, trip: toTripShape(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function dispatch(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM trips WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ ok: false, error: "Trip not found." });
    const trip = rows[0];
    if (trip.status !== "Draft") return res.json({ ok: false, error: "Only Draft trips can be dispatched." });

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("UPDATE trips SET `status` = 'Dispatched' WHERE id = ?", [id]);
      await conn.query("UPDATE vehicles SET `status` = 'On Trip' WHERE id = ?", [trip.vehicleId]);
      await conn.query("UPDATE drivers SET `status` = 'On Trip' WHERE id = ?", [trip.driverId]);
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

async function complete(req, res) {
  try {
    const { id } = req.params;
    const { finalOdometer, fuelUsedL } = req.body;
    const [rows] = await db.query("SELECT * FROM trips WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ ok: false, error: "Trip not found." });
    const trip = rows[0];

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("UPDATE trips SET `status` = 'Completed', fuelUsedL = ? WHERE id = ?", [fuelUsedL, id]);
      await conn.query("UPDATE vehicles SET `status` = 'Available', odometer = ? WHERE id = ?", [finalOdometer, trip.vehicleId]);
      await conn.query("UPDATE drivers SET `status` = 'Available' WHERE id = ?", [trip.driverId]);
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

async function cancel(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM trips WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ ok: false, error: "Trip not found." });
    const trip = rows[0];
    const wasDispatched = trip.status === "Dispatched";

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("UPDATE trips SET `status` = 'Cancelled' WHERE id = ?", [id]);
      if (wasDispatched) {
        await conn.query("UPDATE vehicles SET `status` = 'Available' WHERE id = ?", [trip.vehicleId]);
        await conn.query("UPDATE drivers SET `status` = 'Available' WHERE id = ?", [trip.driverId]);
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

module.exports = { getAll, create, dispatch, complete, cancel };
