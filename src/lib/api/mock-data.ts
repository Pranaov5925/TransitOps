import type {
  Driver,
  Expense,
  FuelLog,
  MaintenanceLog,
  Trip,
  User,
  Vehicle,
} from "./types";

export const MOCK_USERS: (User & { password: string })[] = [
  { id: "u1", email: "manager@transitops.io", password: "demo", role: "fleet_manager", full_name: "Alex Morgan" },
  { id: "u2", email: "dispatch@transitops.io", password: "demo", role: "dispatcher", full_name: "Priya Rao" },
  { id: "u3", email: "safety@transitops.io", password: "demo", role: "safety_officer", full_name: "Jordan Lee" },
  { id: "u4", email: "finance@transitops.io", password: "demo", role: "financial_analyst", full_name: "Chen Wei" },
];

export const seedVehicles: Vehicle[] = [
  { id: "v1", reg_no: "TX-1042", name: "Volvo FH16", type: "Truck", capacity_kg: 24000, odometer_km: 142300, acquisition_cost: 145000, status: "Available", region: "North" },
  { id: "v2", reg_no: "TX-2087", name: "Mercedes Sprinter", type: "Van", capacity_kg: 1500, odometer_km: 88450, acquisition_cost: 52000, status: "On Trip", region: "Central" },
  { id: "v3", reg_no: "TX-3311", name: "Scania R450", type: "Truck", capacity_kg: 22000, odometer_km: 210700, acquisition_cost: 138000, status: "In Shop", region: "North" },
  { id: "v4", reg_no: "TX-4501", name: "Iveco Daily", type: "Van", capacity_kg: 3500, odometer_km: 45200, acquisition_cost: 48000, status: "Available", region: "South" },
  { id: "v5", reg_no: "TX-5590", name: "MAN Lion's Coach", type: "Bus", capacity_kg: 8000, odometer_km: 302000, acquisition_cost: 210000, status: "On Trip", region: "East" },
  { id: "v6", reg_no: "TX-6620", name: "Toyota Hilux", type: "Car", capacity_kg: 1000, odometer_km: 168000, acquisition_cost: 38000, status: "Retired", region: "Central" },
  { id: "v7", reg_no: "TX-7711", name: "DAF XF", type: "Truck", capacity_kg: 26000, odometer_km: 91200, acquisition_cost: 152000, status: "Available", region: "West" },
];

export const seedDrivers: Driver[] = [
  { id: "d1", full_name: "Marcus Bell", license_no: "DL-77812", license_category: "C", license_expiry: "2027-04-12", contact: "+1 555 0142", compliance_pct: 96, safety_score: 92, status: "Active" },
  { id: "d2", full_name: "Sofia Ruiz", license_no: "DL-55103", license_category: "B", license_expiry: "2026-11-30", contact: "+1 555 0198", compliance_pct: 88, safety_score: 85, status: "On Trip" },
  { id: "d3", full_name: "Daniel Cho", license_no: "DL-90021", license_category: "D", license_expiry: "2025-08-01", contact: "+1 555 0210", compliance_pct: 74, safety_score: 68, status: "Suspended" },
  { id: "d4", full_name: "Emma Novak", license_no: "DL-33447", license_category: "C", license_expiry: "2024-02-15", contact: "+1 555 0233", compliance_pct: 82, safety_score: 79, status: "Off Duty" },
  { id: "d5", full_name: "Rahim Khan", license_no: "DL-12089", license_category: "E", license_expiry: "2028-01-20", contact: "+1 555 0299", compliance_pct: 94, safety_score: 90, status: "Active" },
];

export const seedTrips: Trip[] = [
  { id: "t1001", source: "Central Depot", destination: "Harbor Terminal", vehicle_id: "v2", driver_id: "d2", cargo_weight_kg: 1200, planned_distance_km: 180, status: "Dispatched", eta: "14:30", created_at: "2026-07-12T08:00:00Z" },
  { id: "t1002", source: "Warehouse A", destination: "Retail Hub North", vehicle_id: "v5", driver_id: "d5", cargo_weight_kg: 6500, planned_distance_km: 420, status: "Dispatched", eta: "18:15", created_at: "2026-07-12T06:20:00Z" },
  { id: "t1003", source: "Port East", destination: "Depot Central", vehicle_id: null, driver_id: null, cargo_weight_kg: 18000, planned_distance_km: 260, status: "Draft", status_note: "Awaiting vehicle", created_at: "2026-07-12T09:15:00Z" },
  { id: "t1004", source: "Depot South", destination: "Retail Hub West", vehicle_id: "v1", driver_id: null, cargo_weight_kg: 15000, planned_distance_km: 310, status: "Draft", status_note: "Awaiting driver", created_at: "2026-07-12T09:40:00Z" },
  { id: "t1005", source: "Harbor Terminal", destination: "Warehouse B", vehicle_id: "v7", driver_id: "d1", cargo_weight_kg: 20000, planned_distance_km: 145, actual_distance_km: 149, fuel_consumed_l: 52, status: "Completed", created_at: "2026-07-11T13:00:00Z" },
  { id: "t1006", source: "Central Depot", destination: "Airport Cargo", vehicle_id: "v4", driver_id: null, cargo_weight_kg: 2800, planned_distance_km: 62, status: "Cancelled", created_at: "2026-07-11T10:30:00Z" },
];

export const seedMaintenance: MaintenanceLog[] = [
  { id: "m1", vehicle_id: "v3", service_type: "Repair", cost: 3200, date: "2026-07-10", status: "Open", notes: "Transmission overhaul" },
  { id: "m2", vehicle_id: "v1", service_type: "Preventive", cost: 480, date: "2026-06-22", status: "Closed" },
  { id: "m3", vehicle_id: "v5", service_type: "Tire", cost: 1250, date: "2026-06-15", status: "Closed" },
  { id: "m4", vehicle_id: "v7", service_type: "Inspection", cost: 220, date: "2026-05-30", status: "Closed" },
];

export const seedFuel: FuelLog[] = [
  { id: "f1", vehicle_id: "v1", date: "2026-07-11", liters: 320, cost: 512 },
  { id: "f2", vehicle_id: "v2", date: "2026-07-11", liters: 68, cost: 108 },
  { id: "f3", vehicle_id: "v5", date: "2026-07-10", liters: 210, cost: 336 },
  { id: "f4", vehicle_id: "v7", date: "2026-07-10", liters: 280, cost: 448 },
  { id: "f5", vehicle_id: "v4", date: "2026-07-09", liters: 55, cost: 88 },
];

export const seedExpenses: Expense[] = [
  { id: "e1", trip_id: "t1005", vehicle_id: "v7", toll: 45, other: 20, maintenance: 220, total: 285, date: "2026-07-11" },
  { id: "e2", trip_id: "t1001", vehicle_id: "v2", toll: 18, other: 8, maintenance: 0, total: 26, date: "2026-07-12" },
  { id: "e3", trip_id: null, vehicle_id: "v1", toll: 0, other: 60, maintenance: 480, total: 540, date: "2026-06-22" },
];
