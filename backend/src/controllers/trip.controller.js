const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

function toTripShape(t) {
  const obj = {
    id: t.id,
    code: t.code,
    source: t.source,
    sourceState: t.sourceState,
    destination: t.destination,
    destinationState: t.destinationState,
    vehicleId: t.vehicleId,
    driverId: t.driverId,
    cargoKg: t.cargoKg,
    distanceKm: t.distanceKm,
    status: t.status,
    createdAt: t.createdAt,
    estimatedTollCost: t.estimatedTollCost || 0,
  };
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
    const {
      source,
      sourceState,
      destination,
      destinationState,
      vehicleId,
      driverId,
      cargoKg,
      distanceKm,
      estimatedTollCost,
    } = req.body;

    const [vehs] = vehicleId
      ? await db.query("SELECT * FROM vehicles WHERE id = ?", [vehicleId])
      : [[]];
    const [drvs] = driverId
      ? await db.query("SELECT * FROM drivers WHERE id = ?", [driverId])
      : [[]];
    const veh = vehs[0];
    const drv = drvs[0];

    if (!veh || !drv) return res.json({ ok: false, error: "Vehicle and driver required." });
    if (cargoKg !== undefined && Number(cargoKg) < 0)
      return res.json({ ok: false, error: "Cargo weight cannot be negative." });
    if (distanceKm !== undefined && Number(distanceKm) < 0)
      return res.json({ ok: false, error: "Distance cannot be negative." });
    if (estimatedTollCost !== undefined && Number(estimatedTollCost) < 0)
      return res.json({ ok: false, error: "Estimated toll cost cannot be negative." });
    if (veh.status === "Retired" || veh.status === "In Shop")
      return res.json({ ok: false, error: "Vehicle unavailable (In Shop or Retired)." });
    if (veh.status === "On Trip")
      return res.json({ ok: false, error: "Vehicle already on a trip." });
    if (drv.status === "On Trip")
      return res.json({ ok: false, error: "Driver already on a trip." });
    if (drv.status === "Suspended") return res.json({ ok: false, error: "Driver is suspended." });
    if (new Date(drv.licenseExpiry) < new Date())
      return res.json({ ok: false, error: "Driver's license has expired." });
    if (cargoKg > veh.capacityKg)
      return res.json({
        ok: false,
        error: `Cargo weight ${cargoKg} kg exceeds capacity ${veh.capacityKg} kg.`,
      });

    // Permit validation check
    if (sourceState !== destinationState && veh.permitType === "State") {
      return res.json({
        ok: false,
        error:
          "Dispatch blocked: Vehicle is restricted to State Permit Only and cannot be assigned to an interstate trip.",
      });
    }

    // PUC / FC validation check
    const todayStr = new Date().toISOString().slice(0, 10);
    if (veh.pucExpiry && veh.pucExpiry < todayStr) {
      return res.json({
        ok: false,
        error: "Dispatch blocked: Vehicle's Pollution Under Control (PUC) certificate has expired.",
      });
    }
    if (veh.fcExpiry && veh.fcExpiry < todayStr) {
      return res.json({
        ok: false,
        error: "Dispatch blocked: Vehicle's Fitness Certificate (FC) has expired.",
      });
    }

    const id = uuidv4();
    const code = await nextTripCode();
    const createdAt = new Date().toISOString().slice(0, 10);

    await db.query(
      "INSERT INTO trips (id, code, source, sourceState, destination, destinationState, vehicleId, driverId, cargoKg, distanceKm, `status`, createdAt, estimatedTollCost) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        id,
        code,
        source,
        sourceState,
        destination,
        destinationState,
        vehicleId,
        driverId,
        cargoKg,
        distanceKm,
        "Draft",
        createdAt,
        estimatedTollCost !== undefined ? estimatedTollCost : 0,
      ],
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
    if (trip.status !== "Draft")
      return res.json({ ok: false, error: "Only Draft trips can be dispatched." });

    const [vehs] = await db.query("SELECT * FROM vehicles WHERE id = ?", [trip.vehicleId]);
    const veh = vehs[0];
    if (trip.sourceState !== trip.destinationState && veh.permitType === "State") {
      return res.json({
        ok: false,
        error:
          "Dispatch blocked: Vehicle is restricted to State Permit Only and cannot be assigned to an interstate trip.",
      });
    }

    // PUC / FC validation check
    const todayStr = new Date().toISOString().slice(0, 10);
    if (veh.pucExpiry && veh.pucExpiry < todayStr) {
      return res.json({
        ok: false,
        error: "Dispatch blocked: Vehicle's Pollution Under Control (PUC) certificate has expired.",
      });
    }
    if (veh.fcExpiry && veh.fcExpiry < todayStr) {
      return res.json({
        ok: false,
        error: "Dispatch blocked: Vehicle's Fitness Certificate (FC) has expired.",
      });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("UPDATE trips SET `status` = ? WHERE id = ?", ["Dispatched", id]);
      await conn.query("UPDATE vehicles SET `status` = ? WHERE id = ?", [
        "On Trip",
        trip.vehicleId,
      ]);
      await conn.query("UPDATE drivers SET `status` = ? WHERE id = ?", ["On Trip", trip.driverId]);
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
    if (fuelUsedL !== undefined && Number(fuelUsedL) < 0)
      return res.status(400).json({ ok: false, error: "Fuel used cannot be negative." });
    const [rows] = await db.query("SELECT * FROM trips WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ ok: false, error: "Trip not found." });
    const trip = rows[0];

    // Validate final odometer is not lower than vehicle's current odometer
    const [vehs0] = await db.query("SELECT odometer FROM vehicles WHERE id = ?", [trip.vehicleId]);
    if (vehs0.length > 0 && Number(finalOdometer) < Number(vehs0[0].odometer)) {
      return res.status(400).json({
        ok: false,
        error: `Final odometer (${finalOdometer} km) cannot be less than the vehicle's current odometer (${vehs0[0].odometer} km).`,
      });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("UPDATE trips SET `status` = ?, fuelUsedL = ? WHERE id = ?", [
        "Completed",
        fuelUsedL,
        id,
      ]);
      await conn.query("UPDATE vehicles SET `status` = ?, odometer = ? WHERE id = ?", [
        "Available",
        finalOdometer,
        trip.vehicleId,
      ]);
      await conn.query("UPDATE drivers SET `status` = ? WHERE id = ?", [
        "Available",
        trip.driverId,
      ]);

      // Deduct estimatedTollCost from vehicle FASTag wallet
      if (trip.estimatedTollCost > 0) {
        const [vehs] = await conn.query("SELECT fastagBalance FROM vehicles WHERE id = ?", [
          trip.vehicleId,
        ]);
        if (vehs.length > 0) {
          const newBalance = (vehs[0].fastagBalance || 0) - Number(trip.estimatedTollCost);
          await conn.query("UPDATE vehicles SET fastagBalance = ? WHERE id = ?", [
            newBalance,
            trip.vehicleId,
          ]);

          // Log toll auto-deduction in expenses
          const expId = uuidv4();
          const today = new Date().toISOString().slice(0, 10);
          await conn.query(
            "INSERT INTO expenses (id, vehicleId, kind, amount, `date`, note) VALUES (?,?,?,?,?,?)",
            [
              expId,
              trip.vehicleId,
              "Toll",
              trip.estimatedTollCost,
              today,
              `FASTag Auto-deduct for Trip ${trip.code}`,
            ],
          );
        }
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
      await conn.query("UPDATE trips SET `status` = ? WHERE id = ?", ["Cancelled", id]);
      if (wasDispatched) {
        await conn.query("UPDATE vehicles SET `status` = ? WHERE id = ?", [
          "Available",
          trip.vehicleId,
        ]);
        await conn.query("UPDATE drivers SET `status` = ? WHERE id = ?", [
          "Available",
          trip.driverId,
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

module.exports = { getAll, create, dispatch, complete, cancel };
