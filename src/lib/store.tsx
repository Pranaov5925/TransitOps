import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";
import type {
  Vehicle,
  Driver,
  Trip,
  MaintenanceLog,
  FuelLog,
  Expense,
  AuthUser,
  Role,
} from "./types";

interface StoreCtx {
  user: AuthUser | null;
  login: (email: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;

  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  fuel: FuelLog[];
  expenses: Expense[];

  addVehicle: (v: Omit<Vehicle, "id">) => Promise<string | null>;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;

  addDriver: (d: Omit<Driver, "id">) => Promise<void>;
  updateDriver: (id: string, patch: Partial<Driver>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;

  createTrip: (t: Omit<Trip, "id" | "status" | "createdAt" | "code">) => Promise<{ ok: boolean; error?: string }>;
  dispatchTrip: (id: string) => Promise<{ ok: boolean; error?: string }>;
  completeTrip: (id: string, finalOdometer: number, fuelUsedL: number) => Promise<void>;
  cancelTrip: (id: string) => Promise<void>;

  addMaintenance: (m: Omit<MaintenanceLog, "id">) => Promise<void>;
  closeMaintenance: (id: string) => Promise<void>;

  addFuel: (f: Omit<FuelLog, "id">) => Promise<void>;
  addExpense: (e: Omit<Expense, "id">) => Promise<void>;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem("transitops.user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [fuel, setFuel] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // ---------------------------------------------------------------------------
  // Data fetchers
  // ---------------------------------------------------------------------------
  const fetchVehicles = useCallback(async () => { try { setVehicles(await api.get("/vehicles")); } catch (e) { console.error(e); } }, []);
  const fetchDrivers = useCallback(async () => { try { setDrivers(await api.get("/drivers")); } catch (e) { console.error(e); } }, []);
  const fetchTrips = useCallback(async () => { try { setTrips(await api.get("/trips")); } catch (e) { console.error(e); } }, []);
  const fetchMaintenance = useCallback(async () => { try { setMaintenance(await api.get("/maintenance-logs")); } catch (e) { console.error(e); } }, []);
  const fetchFuel = useCallback(async () => { try { setFuel(await api.get("/fuel-logs")); } catch (e) { console.error(e); } }, []);
  const fetchExpenses = useCallback(async () => { try { setExpenses(await api.get("/expenses")); } catch (e) { console.error(e); } }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchVehicles(), fetchDrivers(), fetchTrips(), fetchMaintenance(), fetchFuel(), fetchExpenses()]);
  }, [fetchVehicles, fetchDrivers, fetchTrips, fetchMaintenance, fetchFuel, fetchExpenses]);

  // Fetch everything on mount
  useEffect(() => { refreshAll(); }, [refreshAll]);

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------
  const login = useCallback(async (email: string, password: string, role: Role): Promise<boolean> => {
    try {
      const { data, status } = await api.post<{ user?: AuthUser; error?: string }>("/auth/login", { email, password, role });
      if (status !== 200 || !data.user) return false;
      setUser(data.user);
      if (typeof window !== "undefined") window.localStorage.setItem("transitops.user", JSON.stringify(data.user));
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") window.localStorage.removeItem("transitops.user");
  }, []);

  // ---------------------------------------------------------------------------
  // Vehicles
  // ---------------------------------------------------------------------------
  const addVehicle = useCallback(async (v: Omit<Vehicle, "id">): Promise<string | null> => {
    const { data, status } = await api.post<Vehicle & { error?: string }>("/vehicles", v);
    if (status === 409) return null;
    await fetchVehicles();
    return data.id ?? null;
  }, [fetchVehicles]);

  const updateVehicle = useCallback(async (id: string, patch: Partial<Vehicle>) => {
    await api.patch(`/vehicles/${id}`, patch);
    await fetchVehicles();
  }, [fetchVehicles]);

  const deleteVehicle = useCallback(async (id: string) => {
    await api.del(`/vehicles/${id}`);
    await fetchVehicles();
  }, [fetchVehicles]);

  // ---------------------------------------------------------------------------
  // Drivers
  // ---------------------------------------------------------------------------
  const addDriver = useCallback(async (d: Omit<Driver, "id">) => {
    await api.post("/drivers", d);
    await fetchDrivers();
  }, [fetchDrivers]);

  const updateDriver = useCallback(async (id: string, patch: Partial<Driver>) => {
    await api.patch(`/drivers/${id}`, patch);
    await fetchDrivers();
  }, [fetchDrivers]);

  const deleteDriver = useCallback(async (id: string) => {
    await api.del(`/drivers/${id}`);
    await fetchDrivers();
  }, [fetchDrivers]);

  // ---------------------------------------------------------------------------
  // Trips
  // ---------------------------------------------------------------------------
  const createTrip = useCallback(async (t: Omit<Trip, "id" | "status" | "createdAt" | "code">): Promise<{ ok: boolean; error?: string }> => {
    const { data } = await api.post<{ ok: boolean; error?: string }>("/trips", t);
    if (data.ok) await fetchTrips();
    return data;
  }, [fetchTrips]);

  const dispatchTrip = useCallback(async (id: string): Promise<{ ok: boolean; error?: string }> => {
    const { data } = await api.post<{ ok: boolean; error?: string }>(`/trips/${id}/dispatch`, {});
    if (data.ok) await Promise.all([fetchTrips(), fetchVehicles(), fetchDrivers()]);
    return data;
  }, [fetchTrips, fetchVehicles, fetchDrivers]);

  const completeTrip = useCallback(async (id: string, finalOdometer: number, fuelUsedL: number) => {
    await api.post(`/trips/${id}/complete`, { finalOdometer, fuelUsedL });
    await Promise.all([fetchTrips(), fetchVehicles(), fetchDrivers()]);
  }, [fetchTrips, fetchVehicles, fetchDrivers]);

  const cancelTrip = useCallback(async (id: string) => {
    await api.post(`/trips/${id}/cancel`, {});
    await Promise.all([fetchTrips(), fetchVehicles(), fetchDrivers()]);
  }, [fetchTrips, fetchVehicles, fetchDrivers]);

  // ---------------------------------------------------------------------------
  // Maintenance
  // ---------------------------------------------------------------------------
  const addMaintenance = useCallback(async (m: Omit<MaintenanceLog, "id">) => {
    await api.post("/maintenance-logs", m);
    await Promise.all([fetchMaintenance(), fetchVehicles()]);
  }, [fetchMaintenance, fetchVehicles]);

  const closeMaintenance = useCallback(async (id: string) => {
    await api.post(`/maintenance-logs/${id}/close`, {});
    await Promise.all([fetchMaintenance(), fetchVehicles()]);
  }, [fetchMaintenance, fetchVehicles]);

  // ---------------------------------------------------------------------------
  // Fuel & Expenses
  // ---------------------------------------------------------------------------
  const addFuel = useCallback(async (f: Omit<FuelLog, "id">) => {
    await api.post("/fuel-logs", f);
    await fetchFuel();
  }, [fetchFuel]);

  const addExpense = useCallback(async (e: Omit<Expense, "id">) => {
    await api.post("/expenses", e);
    await fetchExpenses();
  }, [fetchExpenses]);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------
  const value = useMemo<StoreCtx>(
    () => ({
      user, login, logout,
      vehicles, drivers, trips, maintenance, fuel, expenses,
      addVehicle, updateVehicle, deleteVehicle,
      addDriver, updateDriver, deleteDriver,
      createTrip, dispatchTrip, completeTrip, cancelTrip,
      addMaintenance, closeMaintenance,
      addFuel, addExpense,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, vehicles, drivers, trips, maintenance, fuel, expenses],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
