import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  initialVehicles,
  initialDrivers,
  initialTrips,
  initialMaintenance,
  initialFuel,
  initialExpenses,
} from "./mock-data";
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

const uid = () => Math.random().toString(36).slice(2, 10);

interface StoreCtx {
  user: AuthUser | null;
  login: (email: string, role: Role) => void;
  logout: () => void;

  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  fuel: FuelLog[];
  expenses: Expense[];

  addVehicle: (v: Omit<Vehicle, "id">) => string | null;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  addDriver: (d: Omit<Driver, "id">) => void;
  updateDriver: (id: string, patch: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;

  createTrip: (t: Omit<Trip, "id" | "status" | "createdAt" | "code">) => { ok: boolean; error?: string };
  dispatchTrip: (id: string) => { ok: boolean; error?: string };
  completeTrip: (id: string, finalOdometer: number, fuelUsedL: number) => void;
  cancelTrip: (id: string) => void;

  addMaintenance: (m: Omit<MaintenanceLog, "id">) => void;
  closeMaintenance: (id: string) => void;

  addFuel: (f: Omit<FuelLog, "id">) => void;
  addExpense: (e: Omit<Expense, "id">) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem("transitops.user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>(initialMaintenance);
  const [fuel, setFuel] = useState<FuelLog[]>(initialFuel);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const login = useCallback((email: string, role: Role) => {
    const u = { email, role };
    setUser(u);
    if (typeof window !== "undefined") window.localStorage.setItem("transitops.user", JSON.stringify(u));
  }, []);
  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") window.localStorage.removeItem("transitops.user");
  }, []);

  const addVehicle: StoreCtx["addVehicle"] = (v) => {
    // unique reg number rule
    if (vehicles.some((x) => x.regNumber.toLowerCase() === v.regNumber.toLowerCase())) {
      return null;
    }
    const id = uid();
    setVehicles((s) => [...s, { ...v, id }]);
    return id;
  };
  const updateVehicle: StoreCtx["updateVehicle"] = (id, patch) =>
    setVehicles((s) => s.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  const deleteVehicle: StoreCtx["deleteVehicle"] = (id) =>
    setVehicles((s) => s.filter((v) => v.id !== id));

  const addDriver: StoreCtx["addDriver"] = (d) =>
    setDrivers((s) => [...s, { ...d, id: uid() }]);
  const updateDriver: StoreCtx["updateDriver"] = (id, patch) =>
    setDrivers((s) => s.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const deleteDriver: StoreCtx["deleteDriver"] = (id) =>
    setDrivers((s) => s.filter((d) => d.id !== id));

  const createTrip: StoreCtx["createTrip"] = (t) => {
    const veh = vehicles.find((v) => v.id === t.vehicleId);
    const drv = drivers.find((d) => d.id === t.driverId);
    if (!veh || !drv) return { ok: false, error: "Vehicle and driver required." };
    if (veh.status === "Retired" || veh.status === "In Shop")
      return { ok: false, error: "Vehicle unavailable (In Shop or Retired)." };
    if (veh.status === "On Trip") return { ok: false, error: "Vehicle already on a trip." };
    if (drv.status === "On Trip") return { ok: false, error: "Driver already on a trip." };
    if (drv.status === "Suspended") return { ok: false, error: "Driver is suspended." };
    if (new Date(drv.licenseExpiry) < new Date())
      return { ok: false, error: "Driver's license has expired." };
    if (t.cargoKg > veh.capacityKg)
      return { ok: false, error: `Cargo weight ${t.cargoKg} kg exceeds capacity ${veh.capacityKg} kg.` };
    const code = `TR${String(trips.length + 1).padStart(3, "0")}`;
    setTrips((s) => [
      ...s,
      { ...t, id: uid(), status: "Draft", createdAt: new Date().toISOString().slice(0, 10), code },
    ]);
    return { ok: true };
  };

  const dispatchTrip: StoreCtx["dispatchTrip"] = (id) => {
    const trip = trips.find((t) => t.id === id);
    if (!trip) return { ok: false, error: "Trip not found." };
    if (trip.status !== "Draft") return { ok: false, error: "Only Draft trips can be dispatched." };
    setTrips((s) => s.map((t) => (t.id === id ? { ...t, status: "Dispatched" } : t)));
    updateVehicle(trip.vehicleId, { status: "On Trip" });
    updateDriver(trip.driverId, { status: "On Trip" });
    return { ok: true };
  };

  const completeTrip: StoreCtx["completeTrip"] = (id, finalOdometer, fuelUsedL) => {
    const trip = trips.find((t) => t.id === id);
    if (!trip) return;
    setTrips((s) => s.map((t) => (t.id === id ? { ...t, status: "Completed", fuelUsedL } : t)));
    updateVehicle(trip.vehicleId, { status: "Available", odometer: finalOdometer });
    updateDriver(trip.driverId, { status: "Available" });
  };

  const cancelTrip: StoreCtx["cancelTrip"] = (id) => {
    const trip = trips.find((t) => t.id === id);
    if (!trip) return;
    const wasDispatched = trip.status === "Dispatched";
    setTrips((s) => s.map((t) => (t.id === id ? { ...t, status: "Cancelled" } : t)));
    if (wasDispatched) {
      updateVehicle(trip.vehicleId, { status: "Available" });
      updateDriver(trip.driverId, { status: "Available" });
    }
  };

  const addMaintenance: StoreCtx["addMaintenance"] = (m) => {
    setMaintenance((s) => [...s, { ...m, id: uid() }]);
    if (m.status === "Open") updateVehicle(m.vehicleId, { status: "In Shop" });
  };
  const closeMaintenance: StoreCtx["closeMaintenance"] = (id) => {
    const rec = maintenance.find((m) => m.id === id);
    if (!rec) return;
    setMaintenance((s) => s.map((m) => (m.id === id ? { ...m, status: "Closed" } : m)));
    const veh = vehicles.find((v) => v.id === rec.vehicleId);
    if (veh && veh.status !== "Retired") updateVehicle(rec.vehicleId, { status: "Available" });
  };

  const addFuel: StoreCtx["addFuel"] = (f) => setFuel((s) => [...s, { ...f, id: uid() }]);
  const addExpense: StoreCtx["addExpense"] = (e) => setExpenses((s) => [...s, { ...e, id: uid() }]);

  const value = useMemo<StoreCtx>(
    () => ({
      user,
      login,
      logout,
      vehicles,
      drivers,
      trips,
      maintenance,
      fuel,
      expenses,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      addDriver,
      updateDriver,
      deleteDriver,
      createTrip,
      dispatchTrip,
      completeTrip,
      cancelTrip,
      addMaintenance,
      closeMaintenance,
      addFuel,
      addExpense,
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
