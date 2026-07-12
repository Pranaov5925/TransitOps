import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Info, Wrench } from "lucide-react";
import { api } from "@/lib/api/client";
import type { ServiceType } from "@/lib/api/types";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { NotAuthorized } from "@/components/NotAuthorized";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { currency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/maintenance")({
  component: MaintenancePage,
});

const TYPES: ServiceType[] = ["Preventive", "Repair", "Inspection", "Tire", "Other"];

function MaintenancePage() {
  const { user } = useAuth();
  const access = can(user?.role, "maintenance");
  if (access === "none") return <NotAuthorized screen="Maintenance" />;
  const readOnly = access === "view";

  const qc = useQueryClient();
  const logs = useQuery({ queryKey: ["maintenance"], queryFn: () => api.getMaintenanceLogs() });
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: () => api.getVehicles() });

  const [vehicleId, setVehicleId] = useState<string>("");
  const [type, setType] = useState<ServiceType>("Preventive");
  const [cost, setCost] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const open = useMutation({
    mutationFn: () => api.openMaintenance(vehicleId, { service_type: type, cost, date }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      setCost(0);
    },
  });
  const close = useMutation({
    mutationFn: (id: string) => api.closeMaintenance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });

  return (
    <div>
      <PageHeader title="Maintenance" subtitle="Service history and shop status" />
      <Alert className="mb-4 border-warning/40 bg-warning/5">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Vehicles marked <b>In Shop</b> are auto-removed from the Trip Dispatcher pool. Closing all open logs returns the vehicle to <b>Available</b>.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 lg:grid-cols-3">
        {!readOnly && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Log Service Record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Vehicle</Label>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.data?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.reg_no} · {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Service Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as ServiceType)}>
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
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cost</Label>
                  <Input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <Button className="w-full" onClick={() => open.mutate()} disabled={!vehicleId || open.isPending}>
                <Wrench className="h-4 w-4" /> Open Service Record
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className={readOnly ? "lg:col-span-3" : "lg:col-span-2"}>
          <CardHeader>
            <CardTitle className="text-base">Service Log</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  {!readOnly && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.data?.map((m) => {
                  const v = vehicles.data?.find((x) => x.id === m.vehicle_id);
                  return (
                    <TableRow key={m.id}>
                      <TableCell>{m.date}</TableCell>
                      <TableCell>{v?.reg_no ?? m.vehicle_id}</TableCell>
                      <TableCell>{m.service_type}</TableCell>
                      <TableCell>{currency(m.cost)}</TableCell>
                      <TableCell>
                        <StatusBadge status={m.status} />
                      </TableCell>
                      {!readOnly && (
                        <TableCell>
                          {m.status === "Open" && (
                            <Button size="sm" variant="outline" onClick={() => close.mutate(m.id)}>
                              Close
                            </Button>
                          )}
                        </TableCell>
                      )}
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
