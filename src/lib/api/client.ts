import { API_BASE_URL, AUTH_TOKEN_KEY, USE_MOCK_API } from "./config";
import { mockApi } from "./mock";
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

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: Error & { reason?: string } = new Error(body?.reason ?? body?.message ?? res.statusText);
    err.reason = body?.reason;
    throw err;
  }
  return body as T;
}

// A single façade: all screens import from here. Toggling USE_MOCK_API swaps
// the backing implementation with zero refactor at the call sites.
export const api = {
  login: (email: string, password: string): Promise<LoginResponse> =>
    USE_MOCK_API ? mockApi.login(email, password) : req("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  getVehicles: (p?: { type?: string; status?: string; region?: string; search?: string }): Promise<Vehicle[]> =>
    USE_MOCK_API ? mockApi.getVehicles(p) : req(`/vehicles?${new URLSearchParams(p as Record<string, string>)}`),
  createVehicle: (v: Omit<Vehicle, "id">): Promise<Vehicle> =>
    USE_MOCK_API ? mockApi.createVehicle(v) : req("/vehicles", { method: "POST", body: JSON.stringify(v) }),
  updateVehicle: (id: string, patch: Partial<Vehicle>): Promise<Vehicle> =>
    USE_MOCK_API ? mockApi.updateVehicle(id, patch) : req(`/vehicles/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  getDrivers: (p?: { status?: string; search?: string }): Promise<Driver[]> =>
    USE_MOCK_API ? mockApi.getDrivers(p) : req(`/drivers?${new URLSearchParams(p as Record<string, string>)}`),
  createDriver: (d: Omit<Driver, "id">): Promise<Driver> =>
    USE_MOCK_API ? mockApi.createDriver(d) : req("/drivers", { method: "POST", body: JSON.stringify(d) }),
  updateDriver: (id: string, patch: Partial<Driver>): Promise<Driver> =>
    USE_MOCK_API ? mockApi.updateDriver(id, patch) : req(`/drivers/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  getTrips: (): Promise<Trip[]> => (USE_MOCK_API ? mockApi.getTrips() : req("/trips")),
  createTrip: (t: Omit<Trip, "id" | "status" | "created_at">): Promise<Trip> =>
    USE_MOCK_API ? mockApi.createTrip(t) : req("/trips", { method: "POST", body: JSON.stringify(t) }),
  dispatchTrip: (id: string): Promise<DispatchResult> =>
    USE_MOCK_API ? mockApi.dispatchTrip(id) : req(`/trips/${id}/dispatch`, { method: "POST" }),
  completeTrip: (id: string): Promise<Trip> =>
    USE_MOCK_API ? mockApi.completeTrip(id) : req(`/trips/${id}/complete`, { method: "POST" }),
  cancelTrip: (id: string): Promise<Trip> =>
    USE_MOCK_API ? mockApi.cancelTrip(id) : req(`/trips/${id}/cancel`, { method: "POST" }),

  getMaintenanceLogs: (vehicle_id?: string): Promise<MaintenanceLog[]> =>
    USE_MOCK_API ? mockApi.getMaintenanceLogs(vehicle_id) : req(`/maintenance-logs${vehicle_id ? `?vehicle_id=${vehicle_id}` : ""}`),
  openMaintenance: (vehicle_id: string, m: Omit<MaintenanceLog, "id" | "vehicle_id" | "status">): Promise<MaintenanceLog> =>
    USE_MOCK_API ? mockApi.openMaintenance(vehicle_id, m) : req(`/maintenance-logs/${vehicle_id}/open`, { method: "POST", body: JSON.stringify(m) }),
  closeMaintenance: (id: string): Promise<MaintenanceLog> =>
    USE_MOCK_API ? mockApi.closeMaintenance(id) : req(`/maintenance-logs/${id}/close`, { method: "POST" }),

  getFuelLogs: (): Promise<FuelLog[]> => (USE_MOCK_API ? mockApi.getFuelLogs() : req("/fuel-logs")),
  createFuelLog: (f: Omit<FuelLog, "id">): Promise<FuelLog> =>
    USE_MOCK_API ? mockApi.createFuelLog(f) : req("/fuel-logs", { method: "POST", body: JSON.stringify(f) }),
  getExpenses: (): Promise<Expense[]> => (USE_MOCK_API ? mockApi.getExpenses() : req("/expenses")),
  createExpense: (e: Omit<Expense, "id" | "total" | "maintenance">): Promise<Expense> =>
    USE_MOCK_API ? mockApi.createExpense(e) : req("/expenses", { method: "POST", body: JSON.stringify(e) }),

  getDashboardKpis: (): Promise<DashboardKPIs> => (USE_MOCK_API ? mockApi.getDashboardKpis() : req("/dashboard/kpis")),
  getAnalytics: (): Promise<AnalyticsSummary> =>
    USE_MOCK_API ? mockApi.getAnalytics() : req("/analytics/summary"),
  exportCsv: (): Promise<Blob> =>
    USE_MOCK_API
      ? mockApi.exportCsv()
      : fetch(`${API_BASE_URL}/analytics/export.csv`, { headers: authHeaders() }).then((r) => r.blob()),
};
