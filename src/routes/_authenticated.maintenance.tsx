import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { StatusPill } from "@/components/status-pill";
import { useState } from "react";
import { Modal, Field, SelectField } from "./_authenticated.fleet";

export const Route = createFileRoute("/_authenticated/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance — TransitOps" }] }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const { maintenance, vehicles, addMaintenance, closeMaintenance } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    vehicleId: "",
    type: "Oil Change",
    cost: 3000,
    date: new Date().toISOString().slice(0, 10),
    status: "Open" as "Open" | "Closed",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleId) return;
    addMaintenance(form);
    setOpen(false);
    setForm({ vehicleId: "", type: "Oil Change", cost: 3000, date: new Date().toISOString().slice(0, 10), status: "Open" });
  };

  return (
    <AppShell title="Maintenance">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Maintenance Logs</h1>
            <p className="text-sm text-muted-foreground">
              Opening a record flips the vehicle to <span className="text-warning">In Shop</span>. Closing restores it.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110"
          >
            + Log Service
          </button>
        </div>

        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Cost</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {maintenance.map((m) => {
                  const v = vehicles.find((x) => x.id === m.vehicleId);
                  return (
                    <tr key={m.id} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium">{v?.regNumber ?? "—"} · {v?.model}</td>
                      <td className="px-4 py-3">{m.type}</td>
                      <td className="px-4 py-3 text-muted-foreground">₹{m.cost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.date}</td>
                      <td className="px-4 py-3"><StatusPill value={m.status} /></td>
                      <td className="px-4 py-3 text-right">
                        {m.status === "Open" ? (
                          <button
                            onClick={() => closeMaintenance(m.id)}
                            className="text-xs px-2 h-7 rounded-md bg-success text-success-foreground font-medium"
                          >
                            Close Service
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Closed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {open && (
        <Modal title="Log Maintenance" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Vehicle</div>
              <select
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm"
                required
              >
                <option value="">Select vehicle…</option>
                {vehicles.filter((v) => v.status !== "Retired").map((v) => (
                  <option key={v.id} value={v.id}>{v.regNumber} · {v.model}</option>
                ))}
              </select>
            </label>
            <SelectField label="Service Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={["Oil Change", "Tire Rotation", "Brake Service", "Engine Repair", "Inspection"]} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cost" type="number" value={String(form.cost)} onChange={(v) => setForm({ ...form, cost: Number(v) })} />
              <Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            </div>
            <button className="w-full h-10 rounded-md bg-primary text-primary-foreground font-semibold hover:brightness-110">
              Save & Set Vehicle to In Shop
            </button>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}
