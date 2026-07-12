export type Role = "fleet_manager" | "dispatcher" | "safety_officer" | "financial_analyst";

export interface User {
  id: string;
  role: Role;
  full_name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export type VehicleType = "Truck" | "Van" | "Bus" | "Car";

export interface Vehicle {
  id: string;
  reg_no: string;
  name: string;
  type: VehicleType;
  capacity_kg: number;
  odometer_km: number;
  acquisition_cost: number;
  status: VehicleStatus;
  region: string;
}

export type LicenseCategory = "A" | "B" | "C" | "D" | "E";
export type DriverStatus = "Active" | "On Trip" | "Off Duty" | "Suspended";

export interface Driver {
  id: string;
  full_name: string;
  license_no: string;
  license_category: LicenseCategory;
  license_expiry: string; // ISO
  contact: string;
  compliance_pct: number;
  safety_score: number;
  status: DriverStatus;
}

export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicle_id: string | null;
  driver_id: string | null;
  cargo_weight_kg: number;
  planned_distance_km: number;
  actual_distance_km?: number;
  fuel_consumed_l?: number;
  status: TripStatus;
  eta?: string;
  status_note?: string;
  created_at: string;
}

export interface DispatchResult {
  allowed: boolean;
  reason?: string;
  trip?: Trip;
}

export type ServiceStatus = "Open" | "Closed";
export type ServiceType = "Preventive" | "Repair" | "Inspection" | "Tire" | "Other";

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  service_type: ServiceType;
  cost: number;
  date: string;
  status: ServiceStatus;
  notes?: string;
}

export interface FuelLog {
  id: string;
  vehicle_id: string;
  date: string;
  liters: number;
  cost: number;
}

export interface Expense {
  id: string;
  trip_id: string | null;
  vehicle_id: string;
  toll: number;
  other: number;
  maintenance: number; // linked, from maintenance-logs sum
  total: number;
  date: string;
}

export interface DashboardKPIs {
  active_vehicles: number;
  available_vehicles: number;
  in_maintenance: number;
  active_trips: number;
  pending_trips: number;
  drivers_on_duty: number;
  fleet_utilization_pct: number;
  status_breakdown: Record<VehicleStatus, number>;
}

export interface VehicleCostRow {
  vehicle_id: string;
  reg_no: string;
  name: string;
  total_cost: number;
}

export interface AnalyticsSummary {
  fuel_efficiency_kml: number;
  fleet_utilization_pct: number;
  operational_cost: number;
  vehicle_roi_pct: number;
  monthly_revenue: { month: string; revenue: number }[];
  top_costliest: VehicleCostRow[];
}
