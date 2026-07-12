import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Send, XCircle, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Trip, TripStatus } from "@/lib/api/types";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { NotAuthorized } from "@/components/NotAuthorized";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/trips")({
  component: TripsPage,
});

const STEPS: TripStatus[] = ["Draft", "Dispatched", "Completed", "Cancelled"];

function TripsPage() {
  const { user } = useAuth();
  const access = can(user?.role, "trips");
  if (access === "none") return <NotAuthorized screen="Trips" />;
  const readOnly = access === "view";

  const qc = useQueryClient();
  const trips = useQuery({ queryKey: ["trips"], queryFn: api.getTrips });
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: () => api.getVehicles() });
  const drivers = useQuery({ queryKey: ["drivers"], queryFn: () => api.getDrivers() });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["trips"] });
    qc.invalidateQueries({ queryKey: ["vehicles"] });
    qc.invalidateQueries({ queryKey: ["drivers"] });
    qc.invalidateQueries({ queryKey: ["kpis"] });
  };

  return (
    <div>
      <PageHeader title="Trip Dispatcher" subtitle="Plan, dispatch, and track every trip" />

      <TripStepper />

      <div className="grid gap-4 lg:grid-cols-5">
        {!readOnly && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Create Trip</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateTripForm
                vehicles={vehicles.data ?? []}
                drivers={drivers.data ?? []}
                onCreated={invalidate}
              />
            </CardContent>
          </Card>
        )}

        <Card className={readOnly ? "lg:col-span-5" : "lg:col-span-3"}>
          <CardHeader>
            <CardTitle className="text-base">Live Board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trips.isLoading && <div className="text-sm text-muted-foreground">Loading trips…</div>}
            {trips.data?.map((t) => (
              <TripRow
                key={t.id}
                trip={t}
                vehicles={vehicles.data ?? []}
                drivers={drivers.data ?? []}
                onChanged={invalidate}
                readOnly={readOnly}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TripStepper() {
  return (
    <div className="mb-6 flex items-center gap-2 overflow-x-auto rounded-lg border bg-card p-4 shadow-sm">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
              s === "Cancelled" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
            )}
          >
            {i + 1}
          </div>
          <span className="text-sm font-medium">{s}</span>
          {i < STEPS.length - 1 && <div className="h-px w-8 bg-border" />}
        </div>
      ))}
    </div>
  );
}

function CreateTripForm({
  vehicles,
  drivers,
  onCreated,
}: {
  vehicles: import("@/lib/api/types").Vehicle[];
  drivers: import("@/lib/api/types").Driver[];
  onCreated: () => void;
}) {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleId, setVehicleId] = useState<string | undefined>(undefined);
  const [driverId, setDriverId] = useState<string | undefined>(undefined);
  const [cargo, setCargo] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);

  const availableVehicles = useMemo(() => vehicles.filter((v) => v.status === "Available"), [vehicles]);
  const availableDrivers = useMemo(
    () => drivers.filter((d) => d.status === "Active" && new Date(d.license_expiry) > new Date()),
    [drivers],
  );
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const exceedsCapacity = selectedVehicle && cargo > selectedVehicle.capacity_kg;

  const m = useMutation({
    mutationFn: () =>
      api.createTrip({
        source,
        destination,
        vehicle_id: vehicleId ?? null,
        driver_id: driverId ?? null,
        cargo_weight_kg: cargo,
        planned_distance_km: distance,
      }),
    onSuccess: () => {
      onCreated();
      setSource("");
      setDestination("");
      setVehicleId(undefined);
      setDriverId(undefined);
      setCargo(0);
      setDistance(0);
    },
  });

  return (
    <div className="space-y-3">
      <F label="Source">
        <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Central Depot" />
      </F>
      <F label="Destination">
        <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Harbor Terminal" />
      </F>
      <F label="Vehicle (Available only)">
        <Select value={vehicleId} onValueChange={setVehicleId}>
          <SelectTrigger>
            <SelectValue placeholder="Select vehicle" />
          </SelectTrigger>
          <SelectContent>
            {availableVehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.reg_no} · {v.name} · {v.capacity_kg}kg
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </F>
      <F label="Driver (Available only)">
        <Select value={driverId} onValueChange={setDriverId}>
          <SelectTrigger>
            <SelectValue placeholder="Select driver" />
          </SelectTrigger>
          <SelectContent>
            {availableDrivers.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.full_name} · Cat {d.license_category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </F>
      <div className="grid grid-cols-2 gap-3">
        <F label="Cargo Weight (kg)">
          <Input type="number" value={cargo} onChange={(e) => setCargo(Number(e.target.value))} />
        </F>
        <F label="Planned Distance (km)">
          <Input type="number" value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
        </F>
      </div>
      {exceedsCapacity && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cargo ({cargo}kg) exceeds vehicle capacity ({selectedVehicle?.capacity_kg}kg). Reduce cargo or pick a larger vehicle.
          </AlertDescription>
        </Alert>
      )}
      <Button
        className="w-full"
        onClick={() => m.mutate()}
        disabled={!!exceedsCapacity || !source || !destination || m.isPending}
      >
        <Send className="h-4 w-4" /> Create Draft Trip
      </Button>
    </div>
  );
}

function TripRow({
  trip,
  vehicles,
  drivers,
  onChanged,
  readOnly,
}: {
  trip: Trip;
  vehicles: import("@/lib/api/types").Vehicle[];
  drivers: import("@/lib/api/types").Driver[];
  onChanged: () => void;
  readOnly: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const v = vehicles.find((x) => x.id === trip.vehicle_id);
  const d = drivers.find((x) => x.id === trip.driver_id);

  const dispatch = useMutation({
    mutationFn: () => api.dispatchTrip(trip.id),
    onSuccess: (r) => {
      if (!r.allowed) setError(r.reason ?? "Unable to dispatch");
      else {
        setError(null);
        onChanged();
      }
    },
    onError: (e: Error) => setError(e.message),
  });
  const complete = useMutation({
    mutationFn: () => api.completeTrip(trip.id),
    onSuccess: () => {
      setError(null);
      onChanged();
    },
    onError: (e: Error) => setError(e.message),
  });
  const cancel = useMutation({
    mutationFn: () => api.cancelTrip(trip.id),
    onSuccess: () => {
      setError(null);
      onChanged();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{trip.id}</span>
            <StatusBadge status={trip.status} />
          </div>
          <div className="mt-1 text-sm font-medium">
            {trip.source} → {trip.destination}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {v ? `${v.reg_no} · ${v.name}` : "No vehicle"} · {d ? d.full_name : "No driver"} · {trip.cargo_weight_kg}kg ·{" "}
            {trip.planned_distance_km}km
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {trip.status === "Dispatched" ? "ETA" : "Note"}
          </div>
          <div className="text-sm font-medium">{trip.eta ?? trip.status_note ?? "—"}</div>
        </div>
      </div>

      {!readOnly && (
        <div className="mt-3 flex flex-wrap gap-2">
          {trip.status === "Draft" && (
            <Button size="sm" onClick={() => dispatch.mutate()} disabled={dispatch.isPending}>
              <Send className="h-3.5 w-3.5" /> Dispatch
            </Button>
          )}
          {trip.status === "Dispatched" && (
            <Button size="sm" variant="secondary" onClick={() => complete.mutate()} disabled={complete.isPending}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
            </Button>
          )}
          {(trip.status === "Draft" || trip.status === "Dispatched") && (
            <Button size="sm" variant="outline" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
              <XCircle className="h-3.5 w-3.5" /> Cancel
            </Button>
          )}
          {trip.status === "Completed" && (
            <div className="text-xs text-muted-foreground">
              <Circle className="mr-1 inline h-3 w-3" />
              Actual {trip.actual_distance_km}km · {trip.fuel_consumed_l}L fuel
            </div>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
