import type { Role } from "./types";

export const rbacModules = [
  "Dashboard",
  "Fleet",
  "Drivers",
  "Trips",
  "Maintenance",
  "Fuel & Expenses",
  "Analytics",
] as const;

export type RbacModule = (typeof rbacModules)[number];

export const rbacMatrix: Record<Role, Record<RbacModule, "R" | "RW" | "-">> = {
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

export function getPermission(role: Role | undefined, moduleName: RbacModule): "R" | "RW" | "-" {
  if (!role) return "-";
  return rbacMatrix[role]?.[moduleName] ?? "-";
}
