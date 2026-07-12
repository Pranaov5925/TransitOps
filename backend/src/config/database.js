const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "../../../data/db.json");

function ensureDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(
        {
          auth_users: [],
          vehicles: [],
          drivers: [],
          trips: [],
          maintenance_logs: [],
          fuel_logs: [],
          expenses: [],
        },
        null,
        2,
      ),
    );
  }
}

function readDb() {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (e) {
    return {
      auth_users: [],
      vehicles: [],
      drivers: [],
      trips: [],
      maintenance_logs: [],
      fuel_logs: [],
      expenses: [],
    };
  }
}

function writeDb(data) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function executeSql(sql, params = []) {
  const db = readDb();
  const cleanSql = sql.replace(/\s+/g, " ").trim();

  if (cleanSql.toUpperCase().startsWith("CREATE TABLE")) {
    return [{ affectedRows: 0 }];
  }

  if (
    cleanSql.toUpperCase().startsWith("DELETE FROM") &&
    !cleanSql.toUpperCase().includes("WHERE")
  ) {
    const match = cleanSql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_`]+)/i);
    if (match) {
      const table = match[1].replace(/`/g, "");
      db[table] = [];
      writeDb(db);
      return [{ affectedRows: 0 }];
    }
  }

  if (
    cleanSql.toUpperCase().startsWith("DELETE FROM") &&
    cleanSql.toUpperCase().includes("WHERE")
  ) {
    const match = cleanSql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_`]+)\s+WHERE\s+(.+)/i);
    if (match) {
      const table = match[1].replace(/`/g, "");
      const whereClause = match[2];
      const items = db[table] || [];
      if (whereClause.includes("id = ?")) {
        const id = params[0];
        const newItems = items.filter((item) => item.id !== id);
        const affectedRows = items.length - newItems.length;
        db[table] = newItems;
        writeDb(db);
        return [{ affectedRows }];
      }
    }
  }

  if (cleanSql.toUpperCase().startsWith("INSERT INTO")) {
    const match = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_`]+)\s*\(([^)]+)\)\s*VALUES\s*(.+)/i);
    if (match) {
      const table = match[1].replace(/`/g, "");
      const columns = match[2].split(",").map((c) => c.trim().replace(/`/g, ""));
      const valuesPart = match[3];
      const rowsCount = (valuesPart.match(/\(([^)]+)\)/g) || []).length;
      const paramSize = columns.length;
      db[table] = db[table] || [];

      for (let r = 0; r < rowsCount; r++) {
        const rowParams = params.slice(r * paramSize, (r + 1) * paramSize);
        const item = {};
        columns.forEach((col, idx) => {
          item[col] = rowParams[idx];
        });
        item.createdAt = item.createdAt || new Date().toISOString();
        item.updatedAt = item.updatedAt || new Date().toISOString();
        db[table].push(item);
      }
      writeDb(db);
      return [{ affectedRows: rowsCount }];
    }
  }

  if (cleanSql.toUpperCase().startsWith("UPDATE")) {
    const match = cleanSql.match(/UPDATE\s+([a-zA-Z0-9_`]+)\s+SET\s+(.+)\s+WHERE\s+(.+)/i);
    if (match) {
      const table = match[1].replace(/`/g, "");
      const setPart = match[2];
      const items = db[table] || [];
      const updateCols = setPart.split(",").map((s) => s.split("=")[0].trim().replace(/`/g, ""));
      const idVal = params[params.length - 1];
      const updateVals = params.slice(0, params.length - 1);

      let affectedRows = 0;
      db[table] = items.map((item) => {
        if (item.id === idVal) {
          affectedRows++;
          updateCols.forEach((col, idx) => {
            item[col] = updateVals[idx];
          });
          item.updatedAt = new Date().toISOString();
        }
        return item;
      });
      writeDb(db);
      return [{ affectedRows }];
    }
  }

  if (cleanSql.toUpperCase().includes("SELECT COUNT(*)")) {
    const match = cleanSql.match(/FROM\s+([a-zA-Z0-9_`]+)/i);
    if (match) {
      const table = match[1].replace(/`/g, "");
      const count = (db[table] || []).length;
      return [[{ cnt: count }]];
    }
  }

  if (cleanSql.toUpperCase().startsWith("SELECT")) {
    const match = cleanSql.match(/FROM\s+([a-zA-Z0-9_`]+)/i);
    if (match) {
      const table = match[1].replace(/`/g, "");
      let items = db[table] || [];

      if (cleanSql.toUpperCase().includes("WHERE")) {
        const whereIndex = cleanSql.toUpperCase().indexOf("WHERE");
        const whereClause = cleanSql.slice(whereIndex + 5);
        let paramIdx = 0;

        if (whereClause.includes("email = ?")) {
          const emailVal = params[paramIdx++];
          items = items.filter((item) => item.email === emailVal);
        }
        if (whereClause.includes("id = ?")) {
          const idVal = params[paramIdx++];
          items = items.filter((item) => item.id === idVal);
        }
        if (whereClause.includes("regNumber = ?")) {
          const regVal = params[paramIdx++];
          items = items.filter((item) => item.regNumber === regVal);
        }
        if (whereClause.includes("vehicleId = ?")) {
          const vIdVal = params[paramIdx++];
          items = items.filter((item) => item.vehicleId === vIdVal);
        }
        if (whereClause.includes("`type` = ?") || whereClause.includes("type = ?")) {
          const typeVal = params[paramIdx++];
          items = items.filter((item) => item.type === typeVal);
        }
        if (whereClause.includes("`status` = ?") || whereClause.includes("status = ?")) {
          const statusVal = params[paramIdx++];
          items = items.filter((item) => item.status === statusVal);
        }
        if (whereClause.includes("region = ?")) {
          const regionVal = params[paramIdx++];
          items = items.filter((item) => item.region === regionVal);
        }
        if (whereClause.includes("regNumber LIKE ?") || whereClause.includes("model LIKE ?")) {
          const searchVal1 = params[paramIdx++].replace(/%/g, "").toLowerCase();
          const searchVal2 = params[paramIdx++].replace(/%/g, "").toLowerCase();
          items = items.filter(
            (item) =>
              (item.regNumber && item.regNumber.toLowerCase().includes(searchVal1)) ||
              (item.model && item.model.toLowerCase().includes(searchVal2)),
          );
        }
        if (whereClause.includes("name LIKE ?") || whereClause.includes("licenseNumber LIKE ?")) {
          const searchVal1 = params[paramIdx++].replace(/%/g, "").toLowerCase();
          const searchVal2 = params[paramIdx++].replace(/%/g, "").toLowerCase();
          items = items.filter(
            (item) =>
              (item.name && item.name.toLowerCase().includes(searchVal1)) ||
              (item.licenseNumber && item.licenseNumber.toLowerCase().includes(searchVal2)),
          );
        }
      }

      if (cleanSql.toUpperCase().includes("ORDER BY")) {
        items = [...items].sort((a, b) => {
          const tA = new Date(a.createdAt || 0).getTime();
          const tB = new Date(b.createdAt || 0).getTime();
          return tA - tB;
        });
      }

      return [items];
    }
  }

  return [[]];
}

const mockPool = {
  query: async (sql, params) => executeSql(sql, params),
  getConnection: async () => ({
    query: async (sql, params) => executeSql(sql, params),
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  }),
  end: async () => {},
};

module.exports = mockPool;
