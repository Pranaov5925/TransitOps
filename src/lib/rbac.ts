import type { Role } from "./api/types";

export type Screen = "fleet" | "drivers" | "trips" | "maintenance" | "expenses" | "analytics" | "settings" | "dashboard";
export type Access = "full" | "view" | "none";

export const PERMISSIONS: Record<Role, Record<Screen, Access>> = {
  fleet_manager: {
    dashboard: "full",
    fleet: "full",
    drivers: "full",
    trips: "full",
    maintenance: "full",
    expenses: "view",
    analytics: "view",
    settings: "full",
  },
  dispatcher: {
    dashboard: "full",
    fleet: "view",
    drivers: "view",
    trips: "full",
    maintenance: "view",
    expenses: "none",
    analytics: "none",
    settings: "view",
  },
  safety_officer: {
    dashboard: "view",
    fleet: "view",
    drivers: "view",
    trips: "view",
    maintenance: "view",
    expenses: "none",
    analytics: "view",
    settings: "view",
  },
  financial_analyst: {
    dashboard: "view",
    fleet: "view",
    drivers: "none",
    trips: "view",
    maintenance: "view",
    expenses: "full",
    analytics: "view",
    settings: "view",
  },
};

export function can(role: Role | undefined, screen: Screen): Access {
  if (!role) return "none";
  return PERMISSIONS[role][screen];
}

export const ROLES: Role[] = ["fleet_manager", "dispatcher", "safety_officer", "financial_analyst"];
export const SCREENS: Screen[] = ["fleet", "drivers", "trips", "expenses", "analytics"];
