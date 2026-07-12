import type {
  AnalyticsSummary,
  DashboardKPIs,
  DispatchResult,
  Driver,
  Expense,
  FuelLog,
  LoginResponse,
  MaintenanceLog,
  Trip,
  Vehicle,
} from "./types";
import {
  MOCK_USERS,
  seedDrivers,
  seedExpenses,
  seedFuel,
  seedMaintenance,
  seedTrips,
  seedVehicles,
} from "./mock-data";

// In-memory stores (persist for the session).
const db = {
  vehicles: [...seedVehicles],
  drivers: [...seedDrivers],
  trips: [...seedTrips],
  maintenance: [...seedMaintenance],
  fuel: [...seedFuel],
  expenses: [...seedExpenses],
};

const delay = <T>(v: T, ms = 220) => new Promise<T>((r) => setTimeout(() => r(v), ms));

const genId = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 8)}`;

export const mockApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const u = MOCK_USERS.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
    if (!u) throw new Error("Invalid email or password");
    const { password: _, ...user } = u;
    return delay({ token: `mock.${u.id}.${Date.now()}`, user });
  },

  async getVehicles(params: { type?: string; status?: string; region?: string; search?: string } = {}): Promise<Vehicle[]> {
    let list = db.vehicles;
    if (params.type) list = list.filter((v) => v.type === params.type);
    if (params.status) list = list.filter((v) => v.status === params.status);
    if (params.region) list = list.filter((v) => v.region === params.region);
    if (params.search) {
      const s = params.search.toLowerCase();
      list = list.filter((v) => v.reg_no.toLowerCase().includes(s) || v.name.toLowerCase().includes(s));
    }
    return delay([...list]);
  },
  async createVehicle(input: Omit<Vehicle, "id">): Promise<Vehicle> {
    if (db.vehicles.some((v) => v.reg_no.toLowerCase() === input.reg_no.toLowerCase())) {
      throw new Error("Registration number must be unique");
    }
    const v: Vehicle = { ...input, id: genId("v") };
    db.vehicles.unshift(v);
    return delay(v);
  },
  async updateVehicle(id: string, patch: Partial<Vehicle>): Promise<Vehicle> {
    const i = db.vehicles.findIndex((v) => v.id === id);
    if (i < 0) throw new Error("Vehicle not found");
    db.vehicles[i] = { ...db.vehicles[i], ...patch };
    return delay(db.vehicles[i]);
  },

  async getDrivers(params: { status?: string; search?: string } = {}): Promise<Driver[]> {
    let list = db.drivers;
    if (params.status) list = list.filter((d) => d.status === params.status);
    if (params.search) {
      const s = params.search.toLowerCase();
      list = list.filter((d) => d.full_name.toLowerCase().includes(s) || d.license_no.toLowerCase().includes(s));
    }
    return delay([...list]);
  },
  async createDriver(input: Omit<Driver, "id">): Promise<Driver> {
    const d: Driver = { ...input, id: genId("d") };
    db.drivers.unshift(d);
    return delay(d);
  },
  async updateDriver(id: string, patch: Partial<Driver>): Promise<Driver> {
    const i = db.drivers.findIndex((d) => d.id === id);
    if (i < 0) throw new Error("Driver not found");
    db.drivers[i] = { ...db.drivers[i], ...patch };
    return delay(db.drivers[i]);
  },

  async getTrips(): Promise<Trip[]> {
    return delay([...db.trips]);
  },
  async createTrip(input: Omit<Trip, "id" | "status" | "created_at">): Promise<Trip> {
    const t: Trip = {
      ...input,
      id: `t${1000 + Math.floor(Math.random() * 9000)}`,
      status: "Draft",
      created_at: new Date().toISOString(),
      status_note: !input.vehicle_id ? "Awaiting vehicle" : !input.driver_id ? "Awaiting driver" : undefined,
    };
    db.trips.unshift(t);
    return delay(t);
  },
  async dispatchTrip(id: string): Promise<DispatchResult> {
    const t = db.trips.find((x) => x.id === id);
    if (!t) return delay({ allowed: false, reason: "Trip not found" });
    if (t.status !== "Draft") return delay({ allowed: false, reason: `Cannot dispatch a ${t.status} trip` });
    if (!t.vehicle_id) return delay({ allowed: false, reason: "No vehicle assigned" });
    if (!t.driver_id) return delay({ allowed: false, reason: "No driver assigned" });
    const v = db.vehicles.find((x) => x.id === t.vehicle_id);
    const d = db.drivers.find((x) => x.id === t.driver_id);
    if (!v) return delay({ allowed: false, reason: "Vehicle not found" });
    if (!d) return delay({ allowed: false, reason: "Driver not found" });
    if (v.status === "In Shop" || v.status === "Retired")
      return delay({ allowed: false, reason: `Vehicle is ${v.status} and unavailable` });
    if (v.status === "On Trip") return delay({ allowed: false, reason: "Vehicle is already on a trip" });
    if (t.cargo_weight_kg > v.capacity_kg)
      return delay({ allowed: false, reason: `Cargo (${t.cargo_weight_kg}kg) exceeds vehicle capacity (${v.capacity_kg}kg)` });
    if (d.status === "Suspended") return delay({ allowed: false, reason: "Driver is suspended" });
    if (new Date(d.license_expiry) < new Date())
      return delay({ allowed: false, reason: "Driver's license has expired" });
    if (d.status === "On Trip") return delay({ allowed: false, reason: "Driver is already on a trip" });

    t.status = "Dispatched";
    t.status_note = undefined;
    t.eta = new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(11, 16);
    v.status = "On Trip";
    d.status = "On Trip";
    return delay({ allowed: true, trip: t });
  },
  async completeTrip(id: string): Promise<Trip> {
    const t = db.trips.find((x) => x.id === id);
    if (!t) throw new Error("Trip not found");
    if (t.status !== "Dispatched") throw new Error(`Cannot complete a ${t.status} trip`);
    const actual = Math.round(t.planned_distance_km * (0.95 + Math.random() * 0.1));
    const fuel = Math.round(actual / (5 + Math.random() * 3));
    t.status = "Completed";
    t.actual_distance_km = actual;
    t.fuel_consumed_l = fuel;
    if (t.vehicle_id) {
      const v = db.vehicles.find((x) => x.id === t.vehicle_id);
      if (v) v.status = "Available";
    }
    if (t.driver_id) {
      const d = db.drivers.find((x) => x.id === t.driver_id);
      if (d) d.status = "Active";
    }
    return delay(t);
  },
  async cancelTrip(id: string): Promise<Trip> {
    const t = db.trips.find((x) => x.id === id);
    if (!t) throw new Error("Trip not found");
    if (t.status === "Completed") throw new Error("Cannot cancel a completed trip");
    t.status = "Cancelled";
    if (t.vehicle_id) {
      const v = db.vehicles.find((x) => x.id === t.vehicle_id);
      if (v && v.status === "On Trip") v.status = "Available";
    }
    if (t.driver_id) {
      const d = db.drivers.find((x) => x.id === t.driver_id);
      if (d && d.status === "On Trip") d.status = "Active";
    }
    return delay(t);
  },

  async getMaintenanceLogs(vehicle_id?: string): Promise<MaintenanceLog[]> {
    const list = vehicle_id ? db.maintenance.filter((m) => m.vehicle_id === vehicle_id) : db.maintenance;
    return delay([...list]);
  },
  async openMaintenance(vehicle_id: string, input: Omit<MaintenanceLog, "id" | "vehicle_id" | "status">): Promise<MaintenanceLog> {
    const m: MaintenanceLog = { ...input, id: genId("m"), vehicle_id, status: "Open" };
    db.maintenance.unshift(m);
    const v = db.vehicles.find((x) => x.id === vehicle_id);
    if (v && v.status === "Available") v.status = "In Shop";
    return delay(m);
  },
  async closeMaintenance(id: string): Promise<MaintenanceLog> {
    const m = db.maintenance.find((x) => x.id === id);
    if (!m) throw new Error("Log not found");
    m.status = "Closed";
    const stillOpen = db.maintenance.some((x) => x.vehicle_id === m.vehicle_id && x.status === "Open");
    if (!stillOpen) {
      const v = db.vehicles.find((x) => x.id === m.vehicle_id);
      if (v && v.status === "In Shop") v.status = "Available";
    }
    return delay(m);
  },

  async getFuelLogs(): Promise<FuelLog[]> {
    return delay([...db.fuel]);
  },
  async createFuelLog(input: Omit<FuelLog, "id">): Promise<FuelLog> {
    const f: FuelLog = { ...input, id: genId("f") };
    db.fuel.unshift(f);
    return delay(f);
  },
  async getExpenses(): Promise<Expense[]> {
    return delay([...db.expenses]);
  },
  async createExpense(input: Omit<Expense, "id" | "total" | "maintenance">): Promise<Expense> {
    const maintenance = db.maintenance
      .filter((m) => m.vehicle_id === input.vehicle_id && m.date === input.date)
      .reduce((s, m) => s + m.cost, 0);
    const total = input.toll + input.other + maintenance;
    const e: Expense = { ...input, id: genId("e"), maintenance, total };
    db.expenses.unshift(e);
    return delay(e);
  },

  async getDashboardKpis(): Promise<DashboardKPIs> {
    const status_breakdown = {
      Available: db.vehicles.filter((v) => v.status === "Available").length,
      "On Trip": db.vehicles.filter((v) => v.status === "On Trip").length,
      "In Shop": db.vehicles.filter((v) => v.status === "In Shop").length,
      Retired: db.vehicles.filter((v) => v.status === "Retired").length,
    };
    const total = db.vehicles.length;
    const active = status_breakdown.Available + status_breakdown["On Trip"];
    return delay({
      active_vehicles: active,
      available_vehicles: status_breakdown.Available,
      in_maintenance: status_breakdown["In Shop"],
      active_trips: db.trips.filter((t) => t.status === "Dispatched").length,
      pending_trips: db.trips.filter((t) => t.status === "Draft").length,
      drivers_on_duty: db.drivers.filter((d) => d.status === "Active" || d.status === "On Trip").length,
      fleet_utilization_pct: total ? Math.round((status_breakdown["On Trip"] / total) * 100) : 0,
      status_breakdown,
    });
  },

  async getAnalytics(): Promise<AnalyticsSummary> {
    const totalFuelL = db.fuel.reduce((s, f) => s + f.liters, 0);
    const totalKm = db.trips.reduce((s, t) => s + (t.actual_distance_km ?? 0), 0);
    const fuelCost = db.fuel.reduce((s, f) => s + f.cost, 0);
    const maintCost = db.maintenance.reduce((s, m) => s + m.cost, 0);
    const acquisition = db.vehicles.reduce((s, v) => s + v.acquisition_cost, 0);
    const revenue = Math.round(totalKm * 3.2 + db.trips.filter((t) => t.status === "Completed").length * 800);
    const perVehicle: Record<string, number> = {};
    db.fuel.forEach((f) => (perVehicle[f.vehicle_id] = (perVehicle[f.vehicle_id] ?? 0) + f.cost));
    db.maintenance.forEach((m) => (perVehicle[m.vehicle_id] = (perVehicle[m.vehicle_id] ?? 0) + m.cost));
    const top_costliest = Object.entries(perVehicle)
      .map(([vehicle_id, total_cost]) => {
        const v = db.vehicles.find((x) => x.id === vehicle_id);
        return { vehicle_id, reg_no: v?.reg_no ?? "—", name: v?.name ?? "—", total_cost };
      })
      .sort((a, b) => b.total_cost - a.total_cost)
      .slice(0, 5);
    return delay({
      fuel_efficiency_kml: totalFuelL ? Math.round((totalKm / totalFuelL) * 10) / 10 : 0,
      fleet_utilization_pct:
        db.vehicles.length ? Math.round((db.vehicles.filter((v) => v.status === "On Trip").length / db.vehicles.length) * 100) : 0,
      operational_cost: fuelCost + maintCost,
      vehicle_roi_pct: acquisition ? Math.round(((revenue - fuelCost - maintCost) / acquisition) * 1000) / 10 : 0,
      monthly_revenue: [
        { month: "Feb", revenue: 42000 },
        { month: "Mar", revenue: 51000 },
        { month: "Apr", revenue: 48500 },
        { month: "May", revenue: 57200 },
        { month: "Jun", revenue: 62100 },
        { month: "Jul", revenue: revenue || 58900 },
      ],
      top_costliest,
    });
  },

  async exportCsv(): Promise<Blob> {
    const rows = [
      ["vehicle_id", "reg_no", "name", "status", "odometer_km", "acquisition_cost"],
      ...db.vehicles.map((v) => [v.id, v.reg_no, v.name, v.status, v.odometer_km, v.acquisition_cost]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    return delay(new Blob([csv], { type: "text/csv" }));
  },
};
