require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const fs = require("fs");
const path = require("path");
const conn = require("../src/config/database");
const bcrypt = require("bcryptjs");

async function main() {
  console.log("🌱 Connected to JSON Database. Running schema + seed...");

  // Run schema.sql (multi-statement)
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await conn.query(stmt);
  }
  console.log("✅ Tables created.");

  // Clear existing data (order for FK)
  await conn.query("DELETE FROM expenses");
  await conn.query("DELETE FROM fuel_logs");
  await conn.query("DELETE FROM maintenance_logs");
  await conn.query("DELETE FROM trips");
  await conn.query("DELETE FROM drivers");
  await conn.query("DELETE FROM vehicles");
  await conn.query("DELETE FROM auth_users");

  // Auth users
  const hash = await bcrypt.hash("demo1234", 10);
  await conn.query(
    "INSERT INTO auth_users (id, email, passwordHash, role) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)",
    [
      "u1",
      "alex@transitops.co",
      hash,
      "Fleet Manager",
      "u2",
      "dispatcher@transitops.co",
      hash,
      "Dispatcher",
      "u3",
      "safety@transitops.co",
      hash,
      "Safety Officer",
      "u4",
      "finance@transitops.co",
      hash,
      "Financial Analyst",
    ],
  );

  console.log("✅ Seed complete — all mock tables cleaned, auth users seeded.");
  await conn.end();
}

main().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
