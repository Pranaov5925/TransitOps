import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Download } from "lucide-react";
import { getPermission } from "@/lib/rbac";
import { AccessDenied } from "@/components/access-denied";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — TransitOps" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { vehicles, trips, fuel, maintenance, user } = useStore();
  const perm = getPermission(user?.role, "Analytics");

  if (perm === "-") {
    return (
      <AppShell title="Analytics">
        <AccessDenied />
      </AppShell>
    );
  }

  // Compute per-vehicle
  const rows = vehicles.map((v) => {
    const vFuel = fuel.filter((f) => f.vehicleId === v.id);
    const totalLiters = vFuel.reduce((a, b) => a + b.liters, 0);
    const fuelCost = vFuel.reduce((a, b) => a + b.cost, 0);
    const maintCost = maintenance
      .filter((m) => m.vehicleId === v.id)
      .reduce((a, b) => a + b.cost, 0);
    const vTrips = trips.filter((t) => t.vehicleId === v.id && t.status === "Completed");
    const distance = vTrips.reduce((a, b) => a + b.distanceKm, 0);
    const revenue = distance * 40; // mock rate
    const efficiency = totalLiters > 0 ? distance / totalLiters : 0;
    const roi = v.cost > 0 ? (revenue - (fuelCost + maintCost)) / v.cost : 0;
    return { v, totalLiters, fuelCost, maintCost, distance, revenue, efficiency, roi };
  });

  const utilization = vehicles.length
    ? Math.round(
        (vehicles.filter((v) => v.status === "On Trip").length /
          vehicles.filter((v) => v.status !== "Retired").length) *
          100,
      )
    : 0;

  const avgEff =
    rows.filter((r) => r.efficiency > 0).reduce((a, b) => a + b.efficiency, 0) /
    (rows.filter((r) => r.efficiency > 0).length || 1);
  const totalOpCost = rows.reduce((a, b) => a + b.fuelCost + b.maintCost, 0);
  const avgRoi = rows.reduce((a, b) => a + b.roi, 0) / (rows.length || 1);

  const chartData = rows.map((r) => ({
    name: r.v.regNumber,
    fuel: r.fuelCost,
    maintenance: r.maintCost,
  }));
  const pieData = rows
    .filter((r) => r.distance > 0)
    .map((r) => ({ name: r.v.regNumber, value: r.distance }));

  const colors = [
    "oklch(0.72 0.17 55)",
    "oklch(0.7 0.13 230)",
    "oklch(0.7 0.16 155)",
    "oklch(0.78 0.15 85)",
    "oklch(0.62 0.22 25)",
  ];

  const exportCsv = () => {
    const header = [
      "Vehicle",
      "Distance km",
      "Fuel L",
      "Fuel ₹",
      "Maint ₹",
      "Efficiency km/L",
      "ROI %",
    ];
    const csv = [header.join(",")]
      .concat(
        rows.map((r) =>
          [
            r.v.regNumber,
            r.distance,
            r.totalLiters,
            r.fuelCost,
            r.maintCost,
            r.efficiency.toFixed(2),
            (r.roi * 100).toFixed(1),
          ].join(","),
        ),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transitops-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpis = [
    { label: "Avg Fuel Efficiency", value: `${avgEff.toFixed(1)} km/L`, tone: "text-success" },
    { label: "Fleet Utilization", value: `${utilization}%`, tone: "text-primary" },
    { label: "Operational Cost", value: `₹${totalOpCost.toLocaleString()}`, tone: "text-info" },
    { label: "Avg Vehicle ROI", value: `${(avgRoi * 100).toFixed(1)}%`, tone: "text-warning" },
  ];

  return (
    <AppShell title="Analytics">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Fuel efficiency, utilization, costs, and ROI.
            </p>
          </div>
          {perm === "RW" && (
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="card-surface p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {k.label}
              </div>
              <div className={`mt-2 text-2xl font-display font-semibold ${k.tone}`}>{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card-surface p-5">
            <h2 className="font-display font-semibold mb-4">Cost by Vehicle</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.015 260)" />
                <XAxis dataKey="name" stroke="oklch(0.68 0.02 260)" fontSize={12} />
                <YAxis stroke="oklch(0.68 0.02 260)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.014 260)",
                    border: "1px solid oklch(0.3 0.015 260)",
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar
                  dataKey="fuel"
                  fill="oklch(0.72 0.17 55)"
                  name="Fuel ₹"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="maintenance"
                  fill="oklch(0.7 0.13 230)"
                  name="Maintenance ₹"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-surface p-5">
            <h2 className="font-display font-semibold mb-4">Distance Share (km)</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.21 0.014 260)",
                      border: "1px solid oklch(0.3 0.015 260)",
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-muted-foreground italic h-[280px] grid place-items-center">
                Complete trips to see distance share.
              </div>
            )}
          </div>
        </div>

        <div className="card-surface p-5">
          <h2 className="font-display font-semibold mb-3">Per-Vehicle Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Vehicle</th>
                  <th className="pb-2 font-medium">Distance</th>
                  <th className="pb-2 font-medium">Fuel</th>
                  <th className="pb-2 font-medium">Efficiency</th>
                  <th className="pb-2 font-medium">Op. Cost</th>
                  <th className="pb-2 font-medium">Revenue*</th>
                  <th className="pb-2 font-medium">ROI</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.v.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 font-medium">{r.v.regNumber}</td>
                    <td className="py-2 text-muted-foreground">{r.distance} km</td>
                    <td className="py-2 text-muted-foreground">{r.totalLiters} L</td>
                    <td className="py-2 text-success">{r.efficiency.toFixed(2)} km/L</td>
                    <td className="py-2 text-muted-foreground">
                      ₹{(r.fuelCost + r.maintCost).toLocaleString()}
                    </td>
                    <td className="py-2 text-muted-foreground">₹{r.revenue.toLocaleString()}</td>
                    <td
                      className={`py-2 font-medium ${r.roi >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {(r.roi * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            * Revenue is estimated at ₹40/km for demonstration.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
