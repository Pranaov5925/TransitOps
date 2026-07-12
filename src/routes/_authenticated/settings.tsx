import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERMISSIONS, ROLES, SCREENS } from "@/lib/rbac";
import { ROLE_LABEL } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [depot, setDepot] = useState("Central Depot");
  const [currency, setCurrency] = useState("USD");
  const [unit, setUnit] = useState<"km" | "mi">("km");

  return (
    <div>
      <PageHeader title="Settings & RBAC" subtitle="General preferences and role permissions" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Depot Name</Label>
              <Input value={depot} onChange={(e) => setDepot(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["USD", "EUR", "GBP", "INR", "AED"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Distance Unit</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as "km" | "mi")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="km">Kilometers</SelectItem>
                  <SelectItem value="mi">Miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => toast.success("Settings saved")}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Role Permissions (read-only)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-medium text-muted-foreground">Role</th>
                  {SCREENS.map((s) => (
                    <th key={s} className="py-2 text-center font-medium capitalize text-muted-foreground">
                      {s === "expenses" ? "Fuel & Exp." : s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLES.map((r) => (
                  <tr key={r} className="border-b last:border-0">
                    <td className="py-3 font-medium">{ROLE_LABEL[r]}</td>
                    {SCREENS.map((s) => {
                      const a = PERMISSIONS[r][s];
                      return (
                        <td key={s} className="py-3 text-center">
                          <span
                            className={cn(
                              "inline-flex min-w-16 items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
                              a === "full" && "bg-success/15 text-success",
                              a === "view" && "bg-info/15 text-info",
                              a === "none" && "bg-muted text-muted-foreground",
                            )}
                          >
                            {a === "full" ? "Full" : a === "view" ? "View" : "None"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
