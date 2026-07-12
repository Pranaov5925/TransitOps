import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { api } from "@/lib/api/client";
import { useAuth, ROLE_LABEL } from "@/lib/auth";
import type { Role } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("manager@transitops.io");
  const [password, setPassword] = useState("demo");
  const [role, setRole] = useState<Role>("fleet_manager");
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/dashboard", replace: true });
  }, [isAuthenticated, navigate]);

  const mutation = useMutation({
    mutationFn: () => api.login(email, password),
    onSuccess: (data) => {
      login(data.token, { ...data.user, role });
      navigate({ to: "/dashboard", replace: true });
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sidebar via-sidebar to-primary/40 p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-sidebar-border bg-card shadow-2xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground md:flex">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">TransitOps</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold leading-tight">
              Every vehicle, every driver, every trip — in one operational view.
            </h2>
            <p className="mt-4 text-sm text-sidebar-foreground/70">
              Sign in to dispatch trips, monitor fleet health, and track fuel, maintenance and ROI in real time.
            </p>
          </div>
          <div className="text-xs text-sidebar-foreground/60">
            Demo credentials — any role uses password <span className="font-mono text-sidebar-foreground">demo</span>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="p-8 md:p-10"
        >
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Access your TransitOps console</p>

          {mutation.isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{(mutation.error as Error).message}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} /> Remember me
            </label>
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Signing in…" : "Sign in"}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Try emails: manager@ / dispatch@ / safety@ / finance@ transitops.io — password <span className="font-mono">demo</span>
          </p>
        </form>
      </div>
    </div>
  );
}
