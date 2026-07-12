import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Truck, CheckCircle2, Wrench, Route as RouteIcon, Clock, Users, Gauge } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [region, setRegion] = useState<string>("all");

  const kpis = useQuery({ queryKey: ["kpis"], queryFn: api.getDashboardKpis });
  const vehiclesQ = useQuery({
    queryKey: ["vehicles", { type, status, region }],
    queryFn: () =>
      api.getVehicles({
        type: type === "all" ? undefined : type,
        status: status === "all" ? undefined : status,
        region: region === "all" ? undefined : region,
      }),
  });
  const tripsQ = useQuery({ queryKey: ["trips"], queryFn: api.getTrips });

  const cards = [
    { label: "Active Vehicles", value: kpis.data?.active_vehicles, icon: Truck, tone: "text-primary" },
    { label: "Available", value: kpis.data?.available_vehicles, icon: CheckCircle2, tone: "text-success" },
    { label: "In Maintenance", value: kpis.data?.in_maintenance, icon: Wrench, tone: "text-warning-foreground" },
    { label: "Active Trips", value: kpis.data?.active_trips, icon: RouteIcon, tone: "text-info" },
    { label: "Pending Trips", value: kpis.data?.pending_trips, icon: Clock, tone: "text-muted-foreground" },
    { label: "Drivers on Duty", value: kpis.data?.drivers_on_duty, icon: Users, tone: "text-primary" },
    { label: "Fleet Utilization", value: kpis.data ? `${kpis.data.fleet_utilization_pct}%` : undefined, icon: Gauge, tone: "text-accent" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live operational overview across your fleet" />

      <div className="mb-6 flex flex-wrap gap-2 rounded-lg border bg-card p-3 shadow-sm">
        <FilterSelect label="Type" value={type} onChange={setType} options={["Truck", "Van", "Bus", "Car"]} />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={["Available", "On Trip", "In Shop", "Retired"]}
        />
        <FilterSelect label="Region" value={region} onChange={setRegion} options={["North", "South", "East", "West", "Central"]} />
        <div className="ml-auto text-xs text-muted-foreground">Showing {vehiclesQ.data?.length ?? 0} vehicles</div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="border-border/60">
              <CardContent className="p-4">
                <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-muted ${c.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <div className="mt-1 text-2xl font-semibold">
                  {kpis.isLoading ? <Skeleton className="h-7 w-14" /> : c.value ?? "—"}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip ID</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ETA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tripsQ.isLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {tripsQ.data?.slice(0, 6).map((t) => {
                  const v = vehiclesQ.data?.find((x) => x.id === t.vehicle_id);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.id}</TableCell>
                      <TableCell>{v?.reg_no ?? "—"}</TableCell>
                      <TableCell>{t.driver_id ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.eta ?? t.status_note ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vehicle Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {kpis.data &&
              Object.entries(kpis.data.status_breakdown).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                  <StatusBadge status={k} />
                  <span className="text-lg font-semibold">{v}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FilterSelect({
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
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
