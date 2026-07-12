import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { StatusPill } from "@/components/status-pill";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal, Field, SelectField } from "./_authenticated.fleet";
import type { DriverStatus } from "@/lib/types";
import { getPermission } from "@/lib/rbac";
import { AccessDenied } from "@/components/access-denied";

export const Route = createFileRoute("/_authenticated/drivers")({
  head: () => ({ meta: [{ title: "Drivers — TransitOps" }] }),
  component: DriversPage,
});

function DriversPage() {
  const { drivers, addDriver, updateDriver, deleteDriver, user } = useStore();
  const perm = getPermission(user?.role, "Drivers");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    licenseNumber: "",
    licenseCategory: "B",
    licenseExpiry: "2027-01-01",
    contact: "",
    safetyScore: 80,
    status: "Available" as DriverStatus,
  });

  if (perm === "-") {
    return (
      <AppShell title="Drivers">
        <AccessDenied />
      </AppShell>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addDriver(form);
    setOpen(false);
    setForm({
      name: "",
      licenseNumber: "",
      licenseCategory: "B",
      licenseExpiry: "2027-01-01",
      contact: "",
      safetyScore: 80,
      status: "Available",
    });
  };

  const now = new Date();

  return (
    <AppShell title="Drivers">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Drivers & Safety Profiles</h1>
            <p className="text-sm text-muted-foreground">
              Track compliance, licenses, and safety scores.
            </p>
          </div>
          {perm === "RW" && (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110"
            >
              <Plus className="h-4 w-4" /> Add Driver
            </button>
          )}
        </div>

        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">License No.</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Expiry</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Safety</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => {
                  const expired = new Date(d.licenseExpiry) < now;
                  return (
                    <tr key={d.id} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.licenseNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.licenseCategory}</td>
                      <td
                        className={`px-4 py-3 ${expired ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        {d.licenseExpiry} {expired && "· expired"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{d.contact}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-medium ${d.safetyScore >= 85 ? "text-success" : d.safetyScore >= 70 ? "text-warning" : "text-destructive"}`}
                        >
                          {d.safetyScore}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill value={d.status} />
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {perm === "RW" ? (
                          <>
                            <select
                              value={d.status}
                              onChange={(e) =>
                                updateDriver(d.id, { status: e.target.value as DriverStatus })
                              }
                              className="h-8 px-2 rounded-md bg-input border border-border text-xs"
                            >
                              {["Available", "On Trip", "Off Duty", "Suspended"].map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => deleteDriver(d.id)}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Drivers with expired licenses or Suspended status are blocked from trip assignment.
        </p>
      </div>

      {open && (
        <Modal title="Add Driver" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            <Field
              label="Full Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="License Number"
                value={form.licenseNumber}
                onChange={(v) => setForm({ ...form, licenseNumber: v })}
                required
              />
              <SelectField
                label="Category"
                value={form.licenseCategory}
                onChange={(v) => setForm({ ...form, licenseCategory: v })}
                options={["A", "B", "C", "D"]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="License Expiry"
                type="date"
                value={form.licenseExpiry}
                onChange={(v) => setForm({ ...form, licenseExpiry: v })}
              />
              <Field
                label="Contact"
                value={form.contact}
                onChange={(v) => setForm({ ...form, contact: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Safety Score"
                type="number"
                value={String(form.safetyScore)}
                onChange={(v) => setForm({ ...form, safetyScore: Number(v) })}
              />
              <SelectField
                label="Status"
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as DriverStatus })}
                options={["Available", "On Trip", "Off Duty", "Suspended"]}
              />
            </div>
            <button className="w-full h-10 rounded-md bg-primary text-primary-foreground font-semibold hover:brightness-110">
              Save Driver
            </button>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}
