import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { Modal, Field, SelectField } from "./_authenticated.fleet";
import { getPermission } from "@/lib/rbac";
import { AccessDenied } from "@/components/access-denied";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/fuel")({
  head: () => ({ meta: [{ title: "Fuel & Expenses — TransitOps" }] }),
  component: FuelPage,
});

function FuelPage() {
  const { fuel, expenses, vehicles, maintenance, addFuel, addExpense, user } = useStore();
  const perm = getPermission(user?.role, "Fuel & Expenses");
  const [openFuel, setOpenFuel] = useState(false);
  const [openExp, setOpenExp] = useState(false);
  const [fuelForm, setFuelForm] = useState({
    vehicleId: "",
    liters: 0,
    cost: 0,
    date: new Date().toISOString().slice(0, 10),
    odometer: 0,
  });
  const [expForm, setExpForm] = useState({
    vehicleId: "",
    kind: "Toll",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });

  if (perm === "-") {
    return (
      <AppShell title="Fuel & Expenses">
        <AccessDenied />
      </AppShell>
    );
  }

  const totalPerVehicle = vehicles.map((v) => {
    const fuelCost = fuel.filter((f) => f.vehicleId === v.id).reduce((a, b) => a + b.cost, 0);
    const maintCost = maintenance
      .filter((m) => m.vehicleId === v.id)
      .reduce((a, b) => a + b.cost, 0);
    const otherExp = expenses.filter((e) => e.vehicleId === v.id).reduce((a, b) => a + b.amount, 0);
    return { v, fuelCost, maintCost, otherExp, total: fuelCost + maintCost + otherExp };
  });

  return (
    <AppShell title="Fuel & Expenses">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Fuel & Expense Management</h1>
            <p className="text-sm text-muted-foreground">
              Log fuel, tolls, and other operational costs.
            </p>
          </div>
          {perm === "RW" && (
            <div className="flex gap-2">
              <button
                onClick={() => setOpenFuel(true)}
                className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium"
              >
                + Log Fuel
              </button>
              <button
                onClick={() => setOpenExp(true)}
                className="h-9 px-3 rounded-md border border-border text-sm font-medium"
              >
                + Add Expense
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card-surface p-5">
            <h2 className="font-display font-semibold mb-3">Fuel Logs</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Vehicle</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Liters</th>
                  <th className="pb-2 font-medium">Cost</th>
                  <th className="pb-2 font-medium">Odometer</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {fuel.map((f) => {
                  const v = vehicles.find((x) => x.id === f.vehicleId);
                  return (
                    <tr key={f.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2">{v?.regNumber}</td>
                      <td className="py-2 text-muted-foreground">{f.date}</td>
                      <td className="py-2 text-muted-foreground">{f.liters} L</td>
                      <td className="py-2">₹{f.cost.toLocaleString()}</td>
                      <td className="py-2 text-muted-foreground">
                        {f.odometer ? `${f.odometer} km` : "-"}
                      </td>
                      <td className="py-2">
                        {f.pilferageAlert ? (
                          <div
                            className="flex items-center gap-1.5 text-orange-600 bg-orange-500/10 px-2 py-1 rounded w-fit text-[11px] font-medium max-w-[200px]"
                            title={f.pilferageAlert}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Theft Alert</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="card-surface p-5">
            <h2 className="font-display font-semibold mb-3">Other Expenses</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Vehicle</th>
                  <th className="pb-2 font-medium">Kind</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => {
                  const v = vehicles.find((x) => x.id === e.vehicleId);
                  return (
                    <tr key={e.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2">{v?.regNumber}</td>
                      <td className="py-2 text-muted-foreground">{e.kind}</td>
                      <td className="py-2 text-muted-foreground">{e.date}</td>
                      <td className="py-2">₹{e.amount.toLocaleString()}</td>
                    </tr>
                  );
                })}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-xs text-muted-foreground italic">
                      No expenses logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-surface p-5">
          <h2 className="font-display font-semibold mb-3">
            Operational Cost per Vehicle (Fuel + Maintenance + Other)
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Vehicle</th>
                <th className="pb-2 font-medium">Fuel</th>
                <th className="pb-2 font-medium">Maintenance</th>
                <th className="pb-2 font-medium">Other</th>
                <th className="pb-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {totalPerVehicle.map(({ v, fuelCost, maintCost, otherExp, total }) => (
                <tr key={v.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 font-medium">
                    {v.regNumber} · {v.model}
                  </td>
                  <td className="py-2 text-muted-foreground">₹{fuelCost.toLocaleString()}</td>
                  <td className="py-2 text-muted-foreground">₹{maintCost.toLocaleString()}</td>
                  <td className="py-2 text-muted-foreground">₹{otherExp.toLocaleString()}</td>
                  <td className="py-2 font-semibold text-primary">₹{total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openFuel && (
        <Modal title="Log Fuel" onClose={() => setOpenFuel(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!fuelForm.vehicleId) return;
              addFuel(fuelForm);
              setOpenFuel(false);
              setFuelForm({
                vehicleId: "",
                liters: 0,
                cost: 0,
                date: new Date().toISOString().slice(0, 10),
                odometer: 0,
              });
            }}
            className="space-y-3"
          >
            <label className="block">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                Vehicle
              </div>
              <select
                value={fuelForm.vehicleId}
                onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
                className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm"
                required
              >
                <option value="">Select vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.regNumber} · {v.model}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Liters"
                type="number"
                value={String(fuelForm.liters)}
                onChange={(v) => setFuelForm({ ...fuelForm, liters: Number(v) })}
              />
              <Field
                label="Cost"
                type="number"
                value={String(fuelForm.cost)}
                onChange={(v) => setFuelForm({ ...fuelForm, cost: Number(v) })}
              />
            </div>
            <Field
              label="Odometer (km)"
              type="number"
              value={String(fuelForm.odometer)}
              onChange={(v) => setFuelForm({ ...fuelForm, odometer: Number(v) })}
            />
            <Field
              label="Date"
              type="date"
              value={fuelForm.date}
              onChange={(v) => setFuelForm({ ...fuelForm, date: v })}
            />
            <button className="w-full h-10 rounded-md bg-primary text-primary-foreground font-semibold">
              Save
            </button>
          </form>
        </Modal>
      )}

      {openExp && (
        <Modal title="Add Expense" onClose={() => setOpenExp(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!expForm.vehicleId) return;
              addExpense(expForm);
              setOpenExp(false);
              setExpForm({
                vehicleId: "",
                kind: "Toll",
                amount: 0,
                date: new Date().toISOString().slice(0, 10),
                note: "",
              });
            }}
            className="space-y-3"
          >
            <label className="block">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                Vehicle
              </div>
              <select
                value={expForm.vehicleId}
                onChange={(e) => setExpForm({ ...expForm, vehicleId: e.target.value })}
                className="w-full h-9 px-3 rounded-md bg-input border border-border text-sm"
                required
              >
                <option value="">Select vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.regNumber} · {v.model}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Kind"
                value={expForm.kind}
                onChange={(v) => setExpForm({ ...expForm, kind: v })}
                options={["Toll", "Parking", "Permit", "Cleaning", "Misc"]}
              />
              <Field
                label="Amount"
                type="number"
                value={String(expForm.amount)}
                onChange={(v) => setExpForm({ ...expForm, amount: Number(v) })}
              />
            </div>
            <Field
              label="Date"
              type="date"
              value={expForm.date}
              onChange={(v) => setExpForm({ ...expForm, date: v })}
            />
            <Field
              label="Note"
              value={expForm.note}
              onChange={(v) => setExpForm({ ...expForm, note: v })}
            />
            <button className="w-full h-10 rounded-md bg-primary text-primary-foreground font-semibold">
              Save
            </button>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}
