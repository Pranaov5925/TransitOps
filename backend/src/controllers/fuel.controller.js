const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

async function getAll(_req, res) {
  try {
    const [rows] = await db.query(
      "SELECT id, vehicleId, liters, cost, `date`, odometer, pilferageAlert FROM fuel_logs ORDER BY createdAt ASC",
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function create(req, res) {
  try {
    const { vehicleId, liters, cost, date, odometer } = req.body;
    const id = uuidv4();
    let pilferageAlert = null;

    // Validate non-negative inputs
    const numLiters = parseFloat(liters);
    const numCost = parseFloat(cost);
    const numOdometer = parseFloat(odometer);

    if (numLiters < 0) return res.status(400).json({ error: "Liters cannot be negative." });
    if (numCost < 0) return res.status(400).json({ error: "Cost cannot be negative." });
    if (!isNaN(numOdometer) && numOdometer < 0)
      return res.status(400).json({ error: "Odometer cannot be negative." });

    // Validate odometer is not lower than vehicle's current odometer
    if (!isNaN(numOdometer) && numOdometer > 0) {
      const [vehCheck] = await db.query("SELECT odometer FROM vehicles WHERE id = ?", [vehicleId]);
      if (
        vehCheck.length > 0 &&
        Number(vehCheck[0].odometer) > 0 &&
        numOdometer < Number(vehCheck[0].odometer)
      ) {
        return res.status(400).json({
          error: `Odometer reading (${numOdometer} km) cannot be less than the vehicle's current odometer (${vehCheck[0].odometer} km).`,
        });
      }
    }

    if (!isNaN(numOdometer) && numOdometer > 0) {
      // 1. Get vehicle type
      const [vehicles] = await db.query(
        "SELECT id, regNumber, model, `type` FROM vehicles WHERE id = ?",
        [vehicleId],
      );
      if (vehicles.length > 0) {
        const veh = vehicles[0];
        const type = veh.type;

        let expectedEfficiency = 10; // default
        if (type === "Van") expectedEfficiency = 12;
        else if (type === "Truck") expectedEfficiency = 5;
        else if (type === "Bike") expectedEfficiency = 40;
        else if (type === "SUV") expectedEfficiency = 10;

        // 2. Fetch previous fuel logs for this vehicle
        const [prevLogs] = await db.query(
          "SELECT id, vehicleId, odometer FROM fuel_logs WHERE vehicleId = ? ORDER BY createdAt",
          [vehicleId],
        );

        if (prevLogs.length > 0) {
          const lastLog = prevLogs[prevLogs.length - 1];
          const prevOdo = parseFloat(lastLog.odometer || 0);

          if (prevOdo > 0 && numOdometer > prevOdo) {
            const dist = numOdometer - prevOdo;
            const expectedLiters = dist / expectedEfficiency;
            const excessLiters = numLiters - expectedLiters;

            if (expectedLiters > 0) {
              const percentageExcess = excessLiters / expectedLiters;
              if (percentageExcess > 0.3 && excessLiters >= 8) {
                const mathExplanation = `Anomalous consumption: Expected ~${expectedLiters.toFixed(1)}L for ${dist}km, but logged ${numLiters}L (+${(percentageExcess * 100).toFixed(0)}%).`;
                pilferageAlert = mathExplanation;

                if (process.env.GEMINI_API_KEY) {
                  try {
                    const prompt = `Analyze this refueling event for potential siphoning/theft:
- Vehicle Registration: ${veh.regNumber}
- Vehicle Type: ${veh.type} (Expected Efficiency: ${expectedEfficiency} km/L)
- Refueled Amount: ${numLiters} Liters
- Distance Traveled: ${dist} km (Previous Odo: ${prevOdo} km, Current Odo: ${numOdometer} km)
- Expected Fuel Usage: ${expectedLiters.toFixed(1)} Liters
- Excess Fuel Logged: ${excessLiters.toFixed(1)} Liters (+${(percentageExcess * 100).toFixed(0)}% more than expected)

Generate a professional, concise fleet alert describing this anomaly, suspecting fuel pilferage. Keep the summary under 120 characters.`;

                    const apiResponse = await fetch(
                      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          contents: [{ parts: [{ text: prompt }] }],
                        }),
                      },
                    );

                    if (apiResponse.ok) {
                      const apiData = await apiResponse.json();
                      if (apiData.candidates?.[0]?.content?.parts?.[0]?.text) {
                        pilferageAlert = apiData.candidates[0].content.parts[0].text
                          .trim()
                          .substring(0, 255);
                      }
                    }
                  } catch (apiErr) {
                    console.error("Gemini API Error:", apiErr);
                  }
                }
              }
            }
          }
        }
      }
    }

    await db.query(
      "INSERT INTO fuel_logs (id, vehicleId, liters, cost, `date`, odometer, pilferageAlert) VALUES (?,?,?,?,?,?,?)",
      [
        id,
        vehicleId,
        numLiters,
        numCost,
        date,
        isNaN(numOdometer) ? 0 : numOdometer,
        pilferageAlert,
      ],
    );

    // Update vehicle's master odometer if new reading is higher
    if (!isNaN(numOdometer) && numOdometer > 0) {
      const [vehNow] = await db.query("SELECT odometer FROM vehicles WHERE id = ?", [vehicleId]);
      if (vehNow.length > 0 && numOdometer > Number(vehNow[0].odometer)) {
        await db.query("UPDATE vehicles SET odometer = ? WHERE id = ?", [numOdometer, vehicleId]);
      }
    }

    const [rows] = await db.query(
      "SELECT id, vehicleId, liters, cost, `date`, odometer, pilferageAlert FROM fuel_logs WHERE id = ?",
      [id],
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { getAll, create };
