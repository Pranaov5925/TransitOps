import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Fuel, Receipt } from "lucide-react";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NotAuthorized } from "@/components/NotAuthorized";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { currency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensesPage,
});

function ExpensesPage() {
  const { user } = useAuth();
  const access = can(user?.role, "expenses");
  if (access === "none") return <NotAuthorized screen="Fuel & Expenses" />;
  const readOnly = access === "view";

  const qc = useQueryClient();
  const fuel = useQuery({ queryKey: ["fuel"], queryFn: api.getFuelLogs });
  const expenses = useQuery({ queryKey: ["expenses"], queryFn: api.getExpenses });
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: () => api.getVehicles() });
  const trips = useQuery({ queryKey: ["trips"], queryFn: api.getTrips });
  const maint = useQuery({ queryKey: ["maintenance"], queryFn: () => api.getMaintenanceLogs() });

  const totalOperational = useMemo(() => {
    const f = fuel.data?.reduce((s, x) => s + x.cost, 0) ?? 0;
    const m = maint.data?.reduce((s, x) => s + x.cost, 0) ?? 0;
    return f + m;
  }, [fuel.data, maint.data]);

  return (
    <div>
      <PageHeader
        title="Fuel & Expense Management"
        subtitle="Operational costs across the fleet"
        actions={
          <div className="rounded-lg border bg-card px-4 py-2 shadow-sm">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Operational Cost</div>
            <div className="text-lg font-semibold">{currency(totalOperational)}</div>
            <div className="text-[10px] text-muted-foreground">Fuel + Maintenance (from API)</div>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Fuel Logs</CardTitle>
            {!readOnly && (
              <LogFuelForm vehicles={vehicles.data ?? []} onSaved={() => qc.invalidateQueries({ queryKey: ["fuel"] })} />
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Liters</TableHead>
                  <TableHead>Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuel.data?.map((f) => {
                  const v = vehicles.data?.find((x) => x.id === f.vehicle_id);
                  return (
                    <TableRow key={f.id}>
                      <TableCell>{v?.reg_no ?? f.vehicle_id}</TableCell>
                      <TableCell>{f.date}</TableCell>
                      <TableCell>{f.liters}</TableCell>
                      <TableCell>{currency(f.cost)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Other Expenses</CardTitle>
            {!readOnly && (
              <AddExpenseForm
                vehicles={vehicles.data ?? []}
                trips={trips.data ?? []}
                onSaved={() => qc.invalidateQueries({ queryKey: ["expenses"] })}
              />
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Toll</TableHead>
                  <TableHead>Other</TableHead>
                  <TableHead>Maint.</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.data?.map((e) => {
                  const v = vehicles.data?.find((x) => x.id === e.vehicle_id);
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs">{e.trip_id ?? "—"}</TableCell>
                      <TableCell>{v?.reg_no ?? e.vehicle_id}</TableCell>
                      <TableCell>{currency(e.toll)}</TableCell>
                      <TableCell>{currency(e.other)}</TableCell>
                      <TableCell>{currency(e.maintenance)}</TableCell>
                      <TableCell className="font-semibold">{currency(e.total)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LogFuelForm({
  vehicles,
  onSaved,
}: {
  vehicles: import("@/lib/api/types").Vehicle[];
  onSaved: () => void;
}) {
  const [vehicleId, setVehicleId] = useState("");
  const [liters, setLiters] = useState(0);
  const [cost, setCost] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const m = useMutation({
    mutationFn: () => api.createFuelLog({ vehicle_id: vehicleId, liters, cost, date }),
    onSuccess: () => {
      onSaved();
      setLiters(0);
      setCost(0);
    },
  });
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <Label className="text-xs">Vehicle</Label>
        <Select value={vehicleId} onValueChange={setVehicleId}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Pick" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.reg_no}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Liters</Label>
        <Input type="number" value={liters} onChange={(e) => setLiters(Number(e.target.value))} className="w-20" />
      </div>
      <div>
        <Label className="text-xs">Cost</Label>
        <Input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="w-24" />
      </div>
      <div>
        <Label className="text-xs">Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-36" />
      </div>
      <Button size="sm" onClick={() => m.mutate()} disabled={!vehicleId || m.isPending}>
        <Fuel className="h-4 w-4" /> Log
      </Button>
    </div>
  );
}

function AddExpenseForm({
  vehicles,
  trips,
  onSaved,
}: {
  vehicles: import("@/lib/api/types").Vehicle[];
  trips: import("@/lib/api/types").Trip[];
  onSaved: () => void;
}) {
  const [tripId, setTripId] = useState<string>("");
  const [vehicleId, setVehicleId] = useState("");
  const [toll, setToll] = useState(0);
  const [other, setOther] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const m = useMutation({
    mutationFn: () =>
      api.createExpense({
        trip_id: tripId || null,
        vehicle_id: vehicleId,
        toll,
        other,
        date,
      }),
    onSuccess: () => {
      onSaved();
      setToll(0);
      setOther(0);
    },
  });
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <Label className="text-xs">Trip</Label>
        <Select value={tripId} onValueChange={setTripId}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {trips.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Vehicle</Label>
        <Select value={vehicleId} onValueChange={setVehicleId}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Pick" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.reg_no}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Toll</Label>
        <Input type="number" value={toll} onChange={(e) => setToll(Number(e.target.value))} className="w-20" />
      </div>
      <div>
        <Label className="text-xs">Other</Label>
        <Input type="number" value={other} onChange={(e) => setOther(Number(e.target.value))} className="w-20" />
      </div>
      <div>
        <Label className="text-xs">Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-36" />
      </div>
      <Button size="sm" onClick={() => m.mutate()} disabled={!vehicleId || m.isPending}>
        <Receipt className="h-4 w-4" /> Add
      </Button>
    </div>
  );
}
