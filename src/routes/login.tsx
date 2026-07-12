import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { StoreProvider, useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — TransitOps" },
      { name: "description", content: "Sign in to the TransitOps fleet operations console." },
    ],
  }),
  component: () => (
    <StoreProvider>
      <LoginPage />
    </StoreProvider>
  ),
});

const roles: Role[] = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];

function LoginPage() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("alex@transitops.co");
  const [password, setPassword] = useState("demo1234");
  const [role, setRole] = useState<Role>("Fleet Manager");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const locked = attempts >= 3;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    if (!email.includes("@") || password.length < 6) {
      const next = attempts + 1;
      setAttempts(next);
      setError(next >= 3 ? "Account locked after 3 failed attempts." : "Invalid credentials.");
      return;
    }
    login(email, role);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden md:flex flex-col justify-between p-10 bg-sidebar border-r border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold text-lg">
            T
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none">TransitOps</div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">
              Smart Transport Operations
            </div>
          </div>
        </div>
        <div className="space-y-4 max-w-sm">
          <h2 className="font-display text-2xl font-semibold">
            One console for your entire fleet.
          </h2>
          <p className="text-sm text-muted-foreground">
            Register vehicles, dispatch trips, log maintenance and fuel, and watch operational KPIs
            — all with role-based access.
          </p>
          <ul className="text-sm space-y-2">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Fleet Manager · fleet &
              lifecycle
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Dispatcher · trip creation &
              dispatch
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Safety Officer · licensing &
              scores
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Financial Analyst · fuel &
              cost analysis
            </li>
          </ul>
        </div>
        <div className="text-xs text-muted-foreground">© 2026 TransitOps. Hackathon build.</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="font-display text-2xl font-semibold">Sign in to your account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Access the TransitOps operations console.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-3 py-2 text-sm">
              {error} {attempts > 0 && attempts < 3 && `(${3 - attempts} left)`}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring/50 text-sm"
              disabled={locked}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring/50 text-sm"
              disabled={locked}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full h-10 px-3 rounded-md bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring/50 text-sm"
              disabled={locked}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" defaultChecked className="accent-primary" /> Remember me
            </label>
            <button type="button" className="text-primary hover:underline">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={locked}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {locked ? "Locked" : "Sign in"}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            Demo credentials are pre-filled. Pick any role to explore RBAC.
          </p>
        </form>
      </div>
    </div>
  );
}
