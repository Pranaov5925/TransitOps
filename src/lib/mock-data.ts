import type { Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense } from "./types";

export const initialVehicles: Vehicle[] = [
  { id: "v1", regNumber: "GCU-11602", model: "Van-05", type: "Van", capacityKg: 500, odometer: 47000, cost: 620000, status: "Available", region: "North" },
  { id: "v2", regNumber: "GCU-BM19", model: "Truck-11", type: "Truck", capacityKg: 5000, odometer: 128000, cost: 3120000, status: "On Trip", region: "South" },
  { id: "v3", regNumber: "GCU-BM50", model: "Van-08", type: "Van", capacityKg: 800, odometer: 12000, cost: 725000, status: "In Shop", region: "East" },
  { id: "v4", regNumber: "GCU-11629", model: "Truck-06", type: "Truck", capacityKg: 8000, odometer: 210000, cost: 4500000, status: "Retired", region: "West" },
  { id: "v5", regNumber: "GCU-BM09", model: "Van-02", type: "Van", capacityKg: 600, odometer: 33000, cost: 580000, status: "Available", region: "North" },
];

export const initialDrivers: Driver[] = [
  { id: "d1", name: "Alex Reyes", licenseNumber: "DL-8823901", licenseCategory: "C", licenseExpiry: "2027-03-14", contact: "+91 98220 11045", safetyScore: 92, status: "Available" },
  { id: "d2", name: "Maya Iyer", licenseNumber: "DL-7712208", licenseCategory: "B", licenseExpiry: "2026-11-02", contact: "+91 90881 33210", safetyScore: 88, status: "On Trip" },
  { id: "d3", name: "Priya Nair", licenseNumber: "DL-4433118", licenseCategory: "C", licenseExpiry: "2025-08-11", contact: "+91 99123 44980", safetyScore: 76, status: "Off Duty" },
  { id: "d4", name: "Ravi Kumar", licenseNumber: "DL-9911002", licenseCategory: "D", licenseExpiry: "2024-12-01", contact: "+91 90000 11111", safetyScore: 61, status: "Suspended" },
];

export const initialTrips: Trip[] = [
  { id: "t1", code: "TR001", source: "Warehouse A", destination: "Depot 12", vehicleId: "v2", driverId: "d2", cargoKg: 3800, distanceKm: 210, status: "Dispatched", createdAt: "2025-07-08" },
  { id: "t2", code: "TR002", source: "Warehouse B", destination: "Retail 04", vehicleId: "v1", driverId: "d1", cargoKg: 420, distanceKm: 88, status: "Completed", createdAt: "2025-07-06", fuelUsedL: 11 },
  { id: "t3", code: "TR003", source: "Warehouse A", destination: "Retail 09", vehicleId: "v5", driverId: "d3", cargoKg: 300, distanceKm: 45, status: "Draft", createdAt: "2025-07-11" },
];

export const initialMaintenance: MaintenanceLog[] = [
  { id: "m1", vehicleId: "v3", type: "Oil Change", cost: 3500, date: "2025-07-05", status: "Open" },
  { id: "m2", vehicleId: "v2", type: "Tire Rotation", cost: 12000, date: "2025-06-14", status: "Closed" },
];

export const initialFuel: FuelLog[] = [
  { id: "f1", vehicleId: "v1", liters: 44, cost: 4620, date: "2025-07-06" },
  { id: "f2", vehicleId: "v2", liters: 88, cost: 9240, date: "2025-07-04" },
  { id: "f3", vehicleId: "v5", liters: 30, cost: 3150, date: "2025-07-01" },
];

export const initialExpenses: Expense[] = [
  { id: "e1", vehicleId: "v2", kind: "Toll", amount: 850, date: "2025-07-08", note: "NH-48" },
  { id: "e2", vehicleId: "v1", kind: "Parking", amount: 120, date: "2025-07-06" },
];
