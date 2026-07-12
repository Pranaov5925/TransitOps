import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { StatusPill } from "@/components/status-pill";
import { useMemo, useState } from "react";
import { Truck, CheckCircle2, Wrench, RouteIcon, Clock, UserCheck, Gauge } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TransitOps" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { vehicles, drivers, trips } = useStore();
  const [vType, setVType] = useState("all");
  const [vStatus, setVStatus] = useState("all");
  const [region, setRegion] = useState("all");

  const filtered = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          (vType === "all" || v.type === vType) &&
          (vStatus === "all" || v.status === vStatus) &&
          (region === "all" || v.region === region),
      ),
    [vehicles, vType, vStatus, region],
  );

  const active = filtered.filter((v) => v.status !== "Retired").length;
  const available = filtered.filter((v) => v.status === "Available").length;
  const inShop = filtered.filter((v) => v.status === "In Shop").length;
  const activeTrips = trips.filter((t) => t.status === "Dispatched").length;
  const pending = trips.filter((t) => t.status === "Draft").length;
  const onDuty = drivers.filter((d) => d.status === "On Trip").length;
  const utilization = active ? Math.round(((active - available) / active) * 100) : 0;

  const kpis = [
    { label: "Active Vehicles", value: active, Icon: Truck, tone: "text-info" },
    { label: "Available Vehicles", value: available, Icon: CheckCircle2, tone: "text-success" },
    { label: "In Maintenance", value: inShop, Icon: Wrench, tone: "text-warning" },
    { label: "Active Trips", value: activeTrips, Icon: RouteIcon, tone: "text-info" },
    { label: "Pending Trips", value: pending, Icon: Clock, tone: "text-muted-foreground" },
    { label: "Drivers On Duty", value: onDuty, Icon: UserCheck, tone: "text-info" },
    { label: "Fleet Utilization", value: `${utilization}%`, Icon: Gauge, tone: "text-primary" },
  ];

  const recentTrips = trips.slice(-5).reverse();

  const statusBreakdown = [
    {
      label: "Available",
      value: vehicles.filter((v) => v.status === "Available").length,
      color: "bg-success",
    },
    {
      label: "On Trip",
      value: vehicles.filter((v) => v.status === "On Trip").length,
      color: "bg-info",
    },
    {
      label: "In Shop",
      value: vehicles.filter((v) => v.status === "In Shop").length,
      color: "bg-warning",
    },
    {
      label: "Retired",
      value: vehicles.filter((v) => v.status === "Retired").length,
      color: "bg-destructive",
    },
  ];
  const totalV = vehicles.length || 1;

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Operations Overview</h1>
          <p className="text-sm text-muted-foreground">Live KPIs across your fleet.</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Vehicle type"
            value={vType}
            onChange={setVType}
            options={["all", ...Array.from(new Set(vehicles.map((v) => v.type)))]}
          />
          <Select
            label="Status"
            value={vStatus}
            onChange={setVStatus}
            options={["all", "Available", "On Trip", "In Shop", "Retired"]}
          />
          <Select
            label="Region"
            value={region}
            onChange={setRegion}
            options={["all", ...Array.from(new Set(vehicles.map((v) => v.region)))]}
          />
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="card-surface p-4">
              <k.Icon className={`h-4 w-4 ${k.tone}`} />
              <div className="mt-3 text-2xl font-display font-semibold">{k.value}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">
                {k.label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card-surface p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold">Recent Trips</h2>
              <span className="text-xs text-muted-foreground">Latest 5</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="pb-2 pr-4 font-medium">Trip</th>
                    <th className="pb-2 pr-4 font-medium">Vehicle</th>
                    <th className="pb-2 pr-4 font-medium">Driver</th>
                    <th className="pb-2 pr-4 font-medium">Route</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.map((t) => {
                    const v = vehicles.find((x) => x.id === t.vehicleId);
                    const d = drivers.find((x) => x.id === t.driverId);
                    return (
                      <tr key={t.id} className="border-b border-border/60 last:border-0">
                        <td className="py-3 pr-4 font-medium">{t.code}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{v?.model ?? "—"}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{d?.name ?? "—"}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {t.source} → {t.destination}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusPill value={t.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-surface p-5">
            <h2 className="font-display font-semibold mb-4">Vehicle Status</h2>
            <div className="space-y-3">
              {statusBreakdown.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-medium">{s.value}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${s.color}`}
                      style={{ width: `${(s.value / totalV) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Select({
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
          <option key={o} value={o}>
            {o === "all" ? `All ${label.toLowerCase()}` : o}
          </option>
        ))}
      </select>
    </label>
  );
}
