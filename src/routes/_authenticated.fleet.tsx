import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { StatusPill } from "@/components/status-pill";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { VehicleStatus } from "@/lib/types";
import { getPermission } from "@/lib/rbac";
import { AccessDenied } from "@/components/access-denied";

export const Route = createFileRoute("/_authenticated/fleet")({
  head: () => ({ meta: [{ title: "Fleet — TransitOps" }] }),
  component: FleetPage,
});

function FleetPage() {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle, rechargeFastag, user } = useStore();
  const perm = getPermission(user?.role, "Fleet");

  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    regNumber: "",
    model: "",
    type: "Van",
    capacityKg: 500,
    odometer: 0,
    cost: 500000,
    status: "Available" as VehicleStatus,
    region: "North",
    permitType: "National" as "National" | "State",
    fastagBalance: 5000,
    pucExpiry: "2027-07-12",
    fcExpiry: "2027-07-12",
  });

  if (perm === "-") {
    return (
      <AppShell title="Fleet">
        <AccessDenied />
      </AppShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = await addVehicle(form);
      if (!id) {
        setError("Registration number must be unique or vehicle document check failed.");
        return;
      }
      setOpen(false);
      setError(null);
      setForm({
        regNumber: "",
        model: "",
        type: "Van",
        capacityKg: 500,
        odometer: 0,
        cost: 500000,
        status: "Available",
        region: "North",
        permitType: "National",
        fastagBalance: 5000,
        pucExpiry: "2027-07-12",
        fcExpiry: "2027-07-12",
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to create vehicle.";
      setError(errMsg);
    }
  };

  const isExpired = (d: string) => {
    if (!d) return false;
    return new Date(d) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  return (
    <AppShell title="Fleet">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Vehicle Registry</h1>
            <p className="text-sm text-muted-foreground">
              Master list of vehicles across the fleet.
            </p>
          </div>
          {perm === "RW" && (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110"
            >
              <Plus className="h-4 w-4" /> Add Vehicle
            </button>
          )}
        </div>

        {error && !open && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-xs hover:underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Reg. Number</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Capacity</th>
                  <th className="px-4 py-3 font-medium">Odometer</th>
                  <th className="px-4 py-3 font-medium">Acq. Cost</th>
                  <th className="px-4 py-3 font-medium">Permit</th>
                  <th className="px-4 py-3 font-medium">FASTag</th>
                  <th className="px-4 py-3 font-medium">PUC Expiry</th>
                  <th className="px-4 py-3 font-medium">FC Expiry</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium">{v.regNumber}</td>
                    <td className="px-4 py-3">{v.model}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.capacityKg} kg</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {v.odometer.toLocaleString()} km
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">₹{v.cost.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className={v.permitType === "State" ? "text-warning" : "text-success"}>
                        {v.permitType === "State" ? "State Only" : "National (NP)"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5 justify-start">
                        <span className="font-semibold text-foreground">
                          ₹{Math.round(v.fastagBalance || 0).toLocaleString()}
                        </span>
                        {perm === "RW" && (
                          <button
                            onClick={async () => {
                              const amt = prompt("Enter FASTag recharge amount (₹):", "1000");
                              if (amt !== null) {
                                const num = Number(amt);
                                if (isNaN(num) || num <= 0) {
                                  alert("Please enter a valid positive number.");
                                } else {
                                  const res = await rechargeFastag(v.id, num);
                                  if (res && !res.ok) alert(res.error || "Recharge failed");
                                }
                              }
                            }}
                            className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20 px-1.5 py-0.5 rounded"
                          >
                            Recharge
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          isExpired(v.pucExpiry)
                            ? "text-destructive font-semibold"
                            : "text-muted-foreground"
                        }
                      >
                        {v.pucExpiry || "N/A"}
                        {isExpired(v.pucExpiry) && " (Expired)"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          isExpired(v.fcExpiry)
                            ? "text-destructive font-semibold"
                            : "text-muted-foreground"
                        }
                      >
                        {v.fcExpiry || "N/A"}
                        {isExpired(v.fcExpiry) && " (Expired)"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill value={v.status} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {perm === "RW" ? (
                        <>
                          <select
                            value={v.status}
                            onChange={async (e) => {
                              try {
                                setError(null);
                                await updateVehicle(v.id, {
                                  status: e.target.value as VehicleStatus,
                                });
                              } catch (err) {
                                const errMsg =
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to update vehicle status.";
                                setError(errMsg);
                              }
                            }}
                            className="h-8 px-2 rounded-md bg-input border border-border text-xs"
                          >
                            {["Available", "On Trip", "In Shop", "Retired"].map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => deleteVehicle(v.id)}
                            className="text-xs text-destructive hover:underline"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Retired or In Shop vehicles are hidden from dispatch selection automatically.
        </p>
      </div>

      {open && (
        <Modal title="Add Vehicle" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            {error && <div className="text-xs text-destructive">{error}</div>}
            <Field
              label="Registration Number"
              value={form.regNumber}
              onChange={(v) => setForm({ ...form, regNumber: v })}
              required
            />
            <Field
              label="Model / Name"
              value={form.model}
              onChange={(v) => setForm({ ...form, model: v })}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Type"
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v })}
                options={["Van", "Truck", "Bike", "SUV"]}
              />
              <Field
                label="Capacity (kg)"
                type="number"
                value={String(form.capacityKg)}
                onChange={(v) => setForm({ ...form, capacityKg: Number(v) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Odometer (km)"
                type="number"
                value={String(form.odometer)}
                onChange={(v) => setForm({ ...form, odometer: Number(v) })}
              />
              <Field
                label="Acquisition Cost"
                type="number"
                value={String(form.cost)}
                onChange={(v) => setForm({ ...form, cost: Number(v) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Status"
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as VehicleStatus })}
                options={["Available", "On Trip", "In Shop", "Retired"]}
              />
              <SelectField
                label="Region"
                value={form.region}
                onChange={(v) => setForm({ ...form, region: v })}
                options={["North", "South", "East", "West"]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Permit Type"
                value={form.permitType}
                onChange={(v) => setForm({ ...form, permitType: v as "National" | "State" })}
                options={["National", "State"]}
              />
              <Field
                label="FASTag Balance (₹)"
                type="number"
                value={String(form.fastagBalance)}
                onChange={(v) => setForm({ ...form, fastagBalance: Number(v) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="PUC Expiry Date"
                type="date"
                value={form.pucExpiry}
                onChange={(v) => setForm({ ...form, pucExpiry: v })}
                required
              />
              <Field
                label="FC Expiry Date"
                type="date"
                value={form.fcExpiry}
                onChange={(v) => setForm({ ...form, fcExpiry: v })}
                required
              />
            </div>
            <button className="w-full h-10 rounded-md bg-primary text-primary-foreground font-semibold hover:brightness-110">
              Save Vehicle
            </button>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4">
      <div className="card-surface w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
