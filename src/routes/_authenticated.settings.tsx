import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { Check, X } from "lucide-react";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — TransitOps" }] }),
  component: SettingsPage,
});

const modules = ["Dashboard", "Fleet", "Drivers", "Trips", "Maintenance", "Fuel & Expenses", "Analytics"] as const;

const matrix: Record<Role, Record<(typeof modules)[number], "R" | "RW" | "-">> = {
  "Fleet Manager": {
    Dashboard: "R", Fleet: "RW", Drivers: "R", Trips: "R", Maintenance: "RW", "Fuel & Expenses": "R", Analytics: "R",
  },
  Dispatcher: {
    Dashboard: "R", Fleet: "R", Drivers: "R", Trips: "RW", Maintenance: "-", "Fuel & Expenses": "-", Analytics: "R",
  },
  "Safety Officer": {
    Dashboard: "R", Fleet: "R", Drivers: "RW", Trips: "R", Maintenance: "R", "Fuel & Expenses": "-", Analytics: "R",
  },
  "Financial Analyst": {
    Dashboard: "R", Fleet: "R", Drivers: "-", Trips: "R", Maintenance: "R", "Fuel & Expenses": "RW", Analytics: "RW",
  },
};

function Cell({ v }: { v: "R" | "RW" | "-" }) {
  if (v === "-") return <X className="h-4 w-4 text-destructive/70 mx-auto" />;
  if (v === "R") return <Check className="h-4 w-4 text-info mx-auto" />;
  return <span className="status-pill border bg-success/15 text-success border-success/30">RW</span>;
}

function SettingsPage() {
  const { user } = useStore();
  return (
    <AppShell title="Settings">
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl font-semibold">Settings & RBAC</h1>
          <p className="text-sm text-muted-foreground">Access matrix per role. Your role: <span className="text-primary font-medium">{user?.role}</span></p>
        </div>

        <div className="card-surface p-5">
          <h2 className="font-display font-semibold mb-4">Role → Module Access</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  {modules.map((m) => (
                    <th key={m} className="pb-3 px-2 font-medium text-center">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(matrix) as Role[]).map((r) => (
                  <tr key={r} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4 font-medium">
                      {r} {user?.role === r && <span className="text-[10px] text-primary ml-1">(you)</span>}
                    </td>
                    {modules.map((m) => (
                      <td key={m} className="py-3 px-2 text-center"><Cell v={matrix[r][m]} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">RW = Read/Write · R = Read · × = No Access</p>
        </div>

        <div className="card-surface p-5">
          <h2 className="font-display font-semibold mb-3">Profile</h2>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Email</dt><dd className="mt-1">{user?.email}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Role</dt><dd className="mt-1">{user?.role}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Organization</dt><dd className="mt-1">TransitOps Demo</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Session</dt><dd className="mt-1 text-success">Active</dd></div>
          </dl>
        </div>
      </div>
    </AppShell>
  );
}
