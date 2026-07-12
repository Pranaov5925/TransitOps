import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, AlertTriangle, Info } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Driver, DriverStatus, LicenseCategory } from "@/lib/api/types";
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
import { isLicenseExpired } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/drivers")({
  component: DriversPage,
});

const STATUSES: DriverStatus[] = ["Active", "On Trip", "Off Duty", "Suspended"];
const CATS: LicenseCategory[] = ["A", "B", "C", "D", "E"];

function DriversPage() {
  const { user } = useAuth();
  const access = can(user?.role, "drivers");
  if (access === "none") return <NotAuthorized screen="Drivers" />;
  const readOnly = access === "view";

  const qc = useQueryClient();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const drivers = useQuery({
    queryKey: ["drivers", { status, search }],
    queryFn: () => api.getDrivers({ status: status === "all" ? undefined : status, search: search || undefined }),
  });

  const toggle = useMutation({
    mutationFn: (d: Driver) =>
      api.updateDriver(d.id, { status: d.status === "Active" ? "Off Duty" : d.status === "Off Duty" ? "Active" : d.status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });

  return (
    <div>
      <PageHeader
        title="Drivers & Safety Profiles"
        subtitle="License, compliance and safety at a glance"
        actions={!readOnly && <AddDriverDialog onCreated={() => qc.invalidateQueries({ queryKey: ["drivers"] })} />}
      />
      <Alert className="mb-4 border-warning/40 bg-warning/5">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Expired license or <b>Suspended</b> status blocks trip assignment automatically.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <Input placeholder="Search driver or license…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
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
                <TableHead>Driver</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Safety</TableHead>
                <TableHead>Status</TableHead>
                {!readOnly && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {drivers.data?.map((d) => {
                const expired = isLicenseExpired(d.license_expiry);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.full_name}</TableCell>
                    <TableCell className="font-mono text-sm">{d.license_no}</TableCell>
                    <TableCell>{d.license_category}</TableCell>
                    <TableCell>
                      <span className={expired ? "inline-flex items-center gap-1 text-destructive" : ""}>
                        {expired && <AlertTriangle className="h-3.5 w-3.5" />}
                        {d.license_expiry}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.contact}</TableCell>
                    <TableCell>{d.compliance_pct}%</TableCell>
                    <TableCell>{d.safety_score}</TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={d.status === "On Trip" || d.status === "Suspended" || toggle.isPending}
                          onClick={() => toggle.mutate(d)}
                        >
                          {d.status === "Active" ? "Set Off Duty" : "Set Active"}
                        </Button>
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
  );
}

function AddDriverDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Driver, "id">>({
    full_name: "",
    license_no: "",
    license_category: "C",
    license_expiry: "2028-01-01",
    contact: "",
    compliance_pct: 90,
    safety_score: 85,
    status: "Active",
  });
  const m = useMutation({
    mutationFn: () => api.createDriver(form),
    onSuccess: () => {
      onCreated();
      setOpen(false);
    },
    onError: (e: Error) => setErr(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Add Driver
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add driver</DialogTitle>
        </DialogHeader>
        {err && (
          <Alert variant="destructive">
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-3">
          <F label="Full Name">
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </F>
          <F label="License No">
            <Input value={form.license_no} onChange={(e) => setForm({ ...form, license_no: e.target.value })} />
          </F>
          <F label="Category">
            <Select value={form.license_category} onValueChange={(v) => setForm({ ...form, license_category: v as LicenseCategory })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Expiry">
            <Input type="date" value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} />
          </F>
          <F label="Contact">
            <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          </F>
          <F label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as DriverStatus })}>
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
          </F>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !form.full_name || !form.license_no}>
            Save driver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
