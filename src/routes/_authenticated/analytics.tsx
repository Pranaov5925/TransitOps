import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Gauge, TrendingUp, DollarSign, PieChart } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NotAuthorized } from "@/components/NotAuthorized";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { currency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { user } = useAuth();
  const access = can(user?.role, "analytics");
  if (access === "none") return <NotAuthorized screen="Analytics" />;

  const a = useQuery({ queryKey: ["analytics"], queryFn: api.getAnalytics });

  const download = async () => {
    const blob = await api.exportCsv();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transitops-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    { label: "Fuel Efficiency", value: a.data ? `${a.data.fuel_efficiency_kml} km/L` : undefined, icon: Gauge },
    { label: "Fleet Utilization", value: a.data ? `${a.data.fleet_utilization_pct}%` : undefined, icon: PieChart },
    { label: "Operational Cost", value: a.data ? currency(a.data.operational_cost) : undefined, icon: DollarSign },
    { label: "Vehicle ROI", value: a.data ? `${a.data.vehicle_roi_pct}%` : undefined, icon: TrendingUp },
  ];

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Operational KPIs and cost trends"
        actions={
          <Button variant="outline" onClick={download}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <div className="mt-1 text-2xl font-semibold">
                  {a.isLoading ? <Skeleton className="h-8 w-24" /> : c.value ?? "—"}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {a.data && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={a.data.monthly_revenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                    formatter={(v: number) => currency(v)}
                  />
                  <Bar dataKey="revenue" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Costliest Vehicles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {a.data?.top_costliest.map((r, i) => (
              <div key={r.vehicle_id} className="flex items-center gap-3 rounded-md border bg-muted/30 p-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.reg_no}</div>
                  <div className="truncate text-xs text-muted-foreground">{r.name}</div>
                </div>
                <div className="text-sm font-semibold">{currency(r.total_cost)}</div>
              </div>
            ))}
            {a.data?.top_costliest.length === 0 && (
              <div className="text-sm text-muted-foreground">No cost records yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
