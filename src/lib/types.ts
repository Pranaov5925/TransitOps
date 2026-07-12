export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";
export type Role = "Fleet Manager" | "Dispatcher" | "Safety Officer" | "Financial Analyst";

export interface Vehicle {
  id: string;
  regNumber: string;
  model: string;
  type: string;
  capacityKg: number;
  odometer: number;
  cost: number;
  status: VehicleStatus;
  region: string;
  permitType: "National" | "State";
  fastagBalance: number;
  pucExpiry: string;
  fcExpiry: string;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string; // ISO date
  contact: string;
  safetyScore: number;
  status: DriverStatus;
}

export interface Trip {
  id: string;
  code: string;
  source: string;
  sourceState: string;
  destination: string;
  destinationState: string;
  vehicleId: string;
  driverId: string;
  cargoKg: number;
  distanceKm: number;
  status: TripStatus;
  createdAt: string;
  fuelUsedL?: number;
  estimatedTollCost: number;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: string;
  cost: number;
  date: string;
  status: "Open" | "Closed";
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  date: string;
  odometer: number;
  pilferageAlert?: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  kind: string;
  amount: number;
  date: string;
  note?: string;
}

export interface AuthUser {
  email: string;
  role: Role;
}
