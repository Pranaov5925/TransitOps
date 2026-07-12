import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { StatusPill } from "@/components/status-pill";
import { useState } from "react";
import { Modal, Field } from "./_authenticated.fleet";

export const Route = createFileRoute("/_authenticated/trips")({
  head: () => ({ meta: [{ title: "Trip Dispatcher — TransitOps" }] }),
  component: TripsPage,
});

const stages = ["Draft", "Dispatched", "Completed"] as const;

function TripsPage() {
  const { trips, vehicles, drivers, createTrip, dispatchTrip, completeTrip, cancelTrip } = useStore();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    source: "",
    destination: "",
    vehicleId: "",
    driverId: "",
    cargoKg: 0,
    distanceKm: 0,
  });

  const eligibleVehicles = vehicles.filter((v) => v.status === "Available");
  const now = new Date();
  const eligibleDrivers = drivers.filter(
    (d) => d.status === "Available" && new Date(d.licenseExpiry) >= now,
  );

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const capacityViolation = selectedVehicle && form.cargoKg > selectedVehicle.capacityKg;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createTrip(form);
    if (!res.ok) return setError(res.error ?? "Failed");
    setOpen(false);
    setError(null);
    setForm({ source: "", destination: "", vehicleId: "", driverId: "", cargoKg: 0, distanceKm: 0 });
  };

  return (
    <AppShell title="Trips">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Trip Dispatcher</h1>
            <p className="text-sm text-muted-foreground">Create, dispatch, and monitor trips.</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110"
          >
            + New Trip
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {stages.map((stage) => (
            <div key={stage} className="card-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold">{stage}</h2>
                <span className="text-xs text-muted-foreground">
                  {trips.filter((t) => t.status === stage).length}
                </span>
              </div>
              <div className="space-y-2">
                {trips
                  .filter((t) => t.status === stage)
                  .map((t) => {
                    const v = vehicles.find((x) => x.id === t.vehicleId);
                    const d = drivers.find((x) => x.id === t.driverId);
                    return (
                      <div key={t.id} className="rounded-md border border-border bg-background/50 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">{t.code}</div>
                          <StatusPill value={t.status} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t.source} → {t.destination}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {v?.model} · {d?.name} · {t.cargoKg}kg · {t.distanceKm}km
                        </div>
                        <div className="flex gap-2 pt-1">
                          {t.status === "Draft" && (
                            <>
                              <button
                                onClick={() => dispatchTrip(t.id)}
                                className="text-xs px-2 h-7 rounded-md bg-primary text-primary-foreground font-medium"
                              >
                                Dispatch
                              </button>
                              <button
                                onClick={() => cancelTrip(t.id)}
                                className="text-xs px-2 h-7 rounded-md border border-border text-muted-foreground"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {t.status === "Dispatched" && (
                            <>
                              <button
                                onClick={() => {
                                  const veh = vehicles.find((x) => x.id === t.vehicleId);
                                  const finalOdo = (veh?.odometer ?? 0) + t.distanceKm;
                                  const fuel = Math.round(t.distanceKm / 8);
                                  completeTrip(t.id, finalOdo, fuel);
                                }}
                                className="text-xs px-2 h-7 rounded-md bg-success text-success-foreground font-medium"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => cancelTrip(t.id)}
                                className="text-xs px-2 h-7 rounded-md border border-border text-muted-foreground"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {trips.filter((t) => t.status === stage).length === 0 && (
                  <div className="text-xs text-muted-foreground italic">No trips</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {open && (
        <Modal title="Create Trip" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            {error && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Source" value={form.source} onChange={(v) => setForm({ ...form, source: v })} required />
              <Field label="Destination" value={form.destination} onChange={(v) => setForm({ ...form, destination: v })} required />
            </div>

            <label className="block">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Vehicle</div>
              <select
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm"
                required
              >
                <option value="">Select vehicle…</option>
                {eligibleVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.regNumber} · {v.model} · {v.capacityKg}kg
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-muted-foreground mt-1">
                Retired / In Shop / On Trip vehicles hidden
              </div>
            </label>

            <label className="block">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Driver</div>
              <select
                value={form.driverId}
                onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm"
                required
              >
                <option value="">Select driver…</option>
                {eligibleDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · Cat {d.licenseCategory} · Safety {d.safetyScore}
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-muted-foreground mt-1">
                Suspended / expired-license / On Trip drivers hidden
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Cargo Weight (kg)" type="number" value={String(form.cargoKg)} onChange={(v) => setForm({ ...form, cargoKg: Number(v) })} />
              <Field label="Distance (km)" type="number" value={String(form.distanceKm)} onChange={(v) => setForm({ ...form, distanceKm: Number(v) })} />
            </div>

            {capacityViolation && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                Cargo ({form.cargoKg} kg) exceeds vehicle capacity ({selectedVehicle?.capacityKg} kg).
              </div>
            )}

            <button
              disabled={!!capacityViolation}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground font-semibold hover:brightness-110 disabled:opacity-50"
            >
              Create Trip (Draft)
            </button>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}
