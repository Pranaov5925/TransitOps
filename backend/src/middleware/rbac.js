const rbacMatrix = {
  "Fleet Manager": {
    Dashboard: "RW",
    Fleet: "RW",
    Drivers: "RW",
    Trips: "RW",
    Maintenance: "RW",
    "Fuel & Expenses": "RW",
    Analytics: "RW",
  },
  Dispatcher: {
    Dashboard: "R",
    Fleet: "R",
    Drivers: "R",
    Trips: "RW",
    Maintenance: "-",
    "Fuel & Expenses": "-",
    Analytics: "R",
  },
  "Safety Officer": {
    Dashboard: "R",
    Fleet: "R",
    Drivers: "RW",
    Trips: "R",
    Maintenance: "R",
    "Fuel & Expenses": "-",
    Analytics: "R",
  },
  "Financial Analyst": {
    Dashboard: "R",
    Fleet: "R",
    Drivers: "-",
    Trips: "R",
    Maintenance: "R",
    "Fuel & Expenses": "RW",
    Analytics: "RW",
  },
};

const routeToModule = {
  "/dashboard": "Dashboard",
  "/vehicles": "Fleet",
  "/drivers": "Drivers",
  "/trips": "Trips",
  "/maintenance-logs": "Maintenance",
  "/fuel-logs": "Fuel & Expenses",
  "/expenses": "Fuel & Expenses",
  "/analytics": "Analytics",
};

function requireRbac(req, res, next) {
  // Exclude auth routes
  if (req.baseUrl.startsWith("/auth") || req.path === "/health") {
    return next();
  }

  const role = req.headers["x-user-role"];
  if (!role || !rbacMatrix[role]) {
    return res.status(401).json({ error: "Unauthorized: Invalid or missing X-User-Role header." });
  }

  const moduleName = routeToModule[req.baseUrl];
  if (!moduleName) {
    // If not mapped, allow it
    return next();
  }

  const perm = rbacMatrix[role][moduleName];
  if (!perm || perm === "-") {
    return res.status(403).json({ error: `Forbidden: You do not have access to ${moduleName}.` });
  }

  // GET requests only need 'R' or 'RW'
  if (req.method === "GET") {
    return next();
  }

  // POST, PUT, DELETE, PATCH require 'RW'
  if (perm !== "RW") {
    return res
      .status(403)
      .json({ error: `Forbidden: You only have read/write access to ${moduleName}.` });
  }

  next();
}

module.exports = requireRbac;
