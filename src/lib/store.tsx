import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
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

const API_URL = "http://localhost:4000";

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

  addVehicle: (v: Omit<Vehicle, "id">) => Promise<string | null>;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  rechargeFastag: (vehicleId: string, amount: number) => Promise<{ ok: boolean; error?: string }>;

  addDriver: (d: Omit<Driver, "id">) => Promise<void>;
  updateDriver: (id: string, patch: Partial<Driver>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;

  createTrip: (
    t: Omit<Trip, "id" | "status" | "createdAt" | "code">,
  ) => Promise<{ ok: boolean; error?: string }>;
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

  const login = useCallback((email: string, role: Role) => {
    const u = { email, role };
    setUser(u);
    if (typeof window !== "undefined")
      window.localStorage.setItem("transitops.user", JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") window.localStorage.removeItem("transitops.user");
  }, []);

  const apiFetch = useCallback(
    (url: string, init?: RequestInit) => {
      const headers: Record<string, string> = {
        ...(init?.headers as Record<string, string>),
      };
      if (user?.role) {
        headers["X-User-Role"] = user.role;
      }
      return fetch(url, { ...init, headers });
    },
    [user],
  );

  const refreshAll = useCallback(async () => {
    try {
      const [v, d, t, m, f, e] = await Promise.all([
        apiFetch(`${API_URL}/vehicles`).then((r) => r.json()),
        apiFetch(`${API_URL}/drivers`).then((r) => r.json()),
        apiFetch(`${API_URL}/trips`).then((r) => r.json()),
        apiFetch(`${API_URL}/maintenance-logs`).then((r) => r.json()),
        apiFetch(`${API_URL}/fuel-logs`).then((r) => r.json()),
        apiFetch(`${API_URL}/expenses`).then((r) => r.json()),
      ]);
      setVehicles(Array.isArray(v) ? v : []);
      setDrivers(Array.isArray(d) ? d : []);
      setTrips(Array.isArray(t) ? t : []);
      setMaintenance(Array.isArray(m) ? m : []);
      setFuel(Array.isArray(f) ? f : []);
      setExpenses(Array.isArray(e) ? e : []);
    } catch (err) {
      console.error("Error refreshing real-time data from backend:", err);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const addVehicle = useCallback(
    async (v: Omit<Vehicle, "id">) => {
      try {
        const res = await apiFetch(`${API_URL}/vehicles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(v),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("Backend error adding vehicle:", data.error);
          throw new Error(data.error || "Failed to add vehicle.");
        }
        await refreshAll();
        return data.id;
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    [refreshAll],
  );

  const updateVehicle = useCallback(
    async (id: string, patch: Partial<Vehicle>) => {
      try {
        const res = await apiFetch(`${API_URL}/vehicles/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("Backend error updating vehicle:", data.error);
          throw new Error(data.error || "Failed to update vehicle.");
        }
        await refreshAll();
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    [refreshAll],
  );

  const deleteVehicle = useCallback(
    async (id: string) => {
      try {
        const res = await apiFetch(`${API_URL}/vehicles/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("Backend error deleting vehicle:", data.error);
        }
        await refreshAll();
      } catch (err) {
        console.error(err);
      }
    },
    [refreshAll],
  );

  const rechargeFastag = useCallback(
    async (vehicleId: string, amount: number) => {
      try {
        const res = await apiFetch(`${API_URL}/vehicles/${vehicleId}/recharge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });
        if (!res.ok) {
          const data = await res.json();
          return { ok: false, error: data.error || "Failed to recharge" };
        }
        await refreshAll();
        return { ok: true };
      } catch (err) {
        console.error(err);
        return { ok: false, error: "Network error" };
      }
    },
    [refreshAll],
  );

  const addDriver = useCallback(
    async (d: Omit<Driver, "id">) => {
      try {
        const res = await apiFetch(`${API_URL}/drivers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(d),
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("Backend error adding driver:", data.error);
        }
        await refreshAll();
      } catch (err) {
        console.error(err);
      }
    },
    [refreshAll],
  );

  const updateDriver = useCallback(
    async (id: string, patch: Partial<Driver>) => {
      try {
        const res = await apiFetch(`${API_URL}/drivers/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("Backend error updating driver:", data.error);
        }
        await refreshAll();
      } catch (err) {
        console.error(err);
      }
    },
    [refreshAll],
  );

  const deleteDriver = useCallback(
    async (id: string) => {
      try {
        const res = await apiFetch(`${API_URL}/drivers/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("Backend error deleting driver:", data.error);
        }
        await refreshAll();
      } catch (err) {
        console.error(err);
      }
    },
    [refreshAll],
  );

  const createTrip = useCallback(
    async (t: Omit<Trip, "id" | "status" | "createdAt" | "code">) => {
      try {
        const res = await apiFetch(`${API_URL}/trips`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(t),
        });
        const data = await res.json();
        if (!res.ok || data.ok === false) {
          return { ok: false, error: data.error || "Failed to create trip." };
        }
        await refreshAll();
        return { ok: true };
      } catch (err) {
        console.error(err);
        return { ok: false, error: "Network error occurred." };
      }
    },
    [refreshAll],
  );

  const dispatchTrip = useCallback(
    async (id: string) => {
      try {
        const res = await apiFetch(`${API_URL}/trips/${id}/dispatch`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok || data.ok === false) {
          return { ok: false, error: data.error || "Failed to dispatch trip." };
        }
        await refreshAll();
        return { ok: true };
      } catch (err) {
        console.error(err);
        return { ok: false, error: "Network error occurred." };
      }
    },
    [refreshAll],
  );

  const completeTrip = useCallback(
    async (id: string, finalOdometer: number, fuelUsedL: number) => {
      try {
        const res = await apiFetch(`${API_URL}/trips/${id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ finalOdometer, fuelUsedL }),
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("Backend error completing trip:", data.error);
        }
        await refreshAll();
      } catch (err) {
        console.error(err);
      }
    },
    [refreshAll],
  );

  const cancelTrip = useCallback(
    async (id: string) => {
      try {
        const res = await apiFetch(`${API_URL}/trips/${id}/cancel`, {
          method: "POST",
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("Backend error cancelling trip:", data.error);
        }
        await refreshAll();
      } catch (err) {
        console.error(err);
      }
    },
    [refreshAll],
  );

  const addMaintenance = useCallback(
    async (m: Omit<MaintenanceLog, "id">) => {
      try {
        const res = await apiFetch(`${API_URL}/maintenance-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(m),
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("Backend error adding maintenance log:", data.error);
        }
        await refreshAll();
      } catch (err) {
        console.error(err);
      }
    },
    [refreshAll],
  );

  const closeMaintenance = useCallback(
    async (id: string) => {
      try {
        const res = await apiFetch(`${API_URL}/maintenance-logs/${id}/close`, {
          method: "POST",
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("Backend error closing maintenance log:", data.error);
        }
        await refreshAll();
      } catch (err) {
        console.error(err);
      }
    },
    [refreshAll],
  );

  const addFuel = useCallback(
    async (f: Omit<FuelLog, "id">) => {
      try {
        const res = await apiFetch(`${API_URL}/fuel-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(f),
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("Backend error adding fuel log:", data.error);
        }
        await refreshAll();
      } catch (err) {
        console.error(err);
      }
    },
    [refreshAll],
  );

  const addExpense = useCallback(
    async (e: Omit<Expense, "id">) => {
      try {
        const res = await apiFetch(`${API_URL}/expenses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(e),
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("Backend error adding expense:", data.error);
        }
        await refreshAll();
      } catch (err) {
        console.error(err);
      }
    },
    [refreshAll],
  );

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
      rechargeFastag,
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
    [
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
      rechargeFastag,
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
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
