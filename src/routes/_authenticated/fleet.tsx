import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Info } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Vehicle, VehicleStatus, VehicleType } from "@/lib/api/types";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { NotAuthorized } from "@/components/NotAuthorized";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { currency, num } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/fleet")({
  component: FleetPage,
});

const TYPES: VehicleType[] = ["Truck", "Van", "Bus", "Car"];
const STATUSES: VehicleStatus[] = ["Available", "On Trip", "In Shop", "Retired"];

function FleetPage() {
  const { user } = useAuth();
  const access = can(user?.role, "fleet");
  if (access === "none") return <NotAuthorized screen="Fleet" />;
  const readOnly = access === "view";

  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const qc = useQueryClient();
  const vehicles = useQuery({
    queryKey: ["vehicles", { type, status, search }],
    queryFn: () =>
      api.getVehicles({
        type: type === "all" ? undefined : type,
        status: status === "all" ? undefined : status,
        search: search || undefined,
      }),
  });

  return (
    <div>
      <PageHeader
        title="Vehicle Registry"
        subtitle="Master list of every vehicle in the fleet"
        actions={!readOnly && <AddVehicleDialog onCreated={() => qc.invalidateQueries({ queryKey: ["vehicles"] })} />}
      />

      <Alert className="mb-4 border-info/30 bg-info/5 text-foreground">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Registration number must be unique. Vehicles in <b>Retired</b> or <b>In Shop</b> status are hidden from the
          Trip Dispatcher.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search reg no or model…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg No</TableHead>
                <TableHead>Name / Model</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Odometer</TableHead>
                <TableHead>Acquisition</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {vehicles.data?.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-sm">{v.reg_no}</TableCell>
                  <TableCell>{v.name}</TableCell>
                  <TableCell>{v.type}</TableCell>
                  <TableCell>{num(v.capacity_kg)} kg</TableCell>
                  <TableCell>{num(v.odometer_km)} km</TableCell>
                  <TableCell>{currency(v.acquisition_cost)}</TableCell>
                  <TableCell>
                    <StatusBadge status={v.status} />
                  </TableCell>
                </TableRow>
              ))}
              {vehicles.data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No vehicles match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AddVehicleDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Vehicle, "id">>({
    reg_no: "",
    name: "",
    type: "Truck",
    capacity_kg: 1000,
    odometer_km: 0,
    acquisition_cost: 0,
    status: "Available",
    region: "Central",
  });
  const [err, setErr] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () => api.createVehicle(form),
    onSuccess: () => {
      onCreated();
      setOpen(false);
      setErr(null);
    },
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Add Vehicle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add vehicle</DialogTitle>
        </DialogHeader>
        {err && (
          <Alert variant="destructive">
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Reg No">
            <Input value={form.reg_no} onChange={(e) => setForm({ ...form, reg_no: e.target.value })} />
          </Field>
          <Field label="Name / Model">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Type">
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as VehicleType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Region">
            <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
          </Field>
          <Field label="Capacity (kg)">
            <Input
              type="number"
              value={form.capacity_kg}
              onChange={(e) => setForm({ ...form, capacity_kg: Number(e.target.value) })}
            />
          </Field>
          <Field label="Odometer (km)">
            <Input
              type="number"
              value={form.odometer_km}
              onChange={(e) => setForm({ ...form, odometer_km: Number(e.target.value) })}
            />
          </Field>
          <Field label="Acquisition Cost">
            <Input
              type="number"
              value={form.acquisition_cost}
              onChange={(e) => setForm({ ...form, acquisition_cost: Number(e.target.value) })}
            />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as VehicleStatus })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !form.reg_no || !form.name}>
            {m.isPending ? "Saving…" : "Save vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
