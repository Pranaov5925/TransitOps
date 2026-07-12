import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route as RouteIcon,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABEL, useAuth } from "@/lib/auth";
import { can, type Screen } from "@/lib/rbac";
import type { ReactNode } from "react";

const NAV: { to: string; label: string; icon: typeof Truck; screen: Screen }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, screen: "dashboard" },
  { to: "/fleet", label: "Fleet", icon: Truck, screen: "fleet" },
  { to: "/drivers", label: "Drivers", icon: Users, screen: "drivers" },
  { to: "/trips", label: "Trips", icon: RouteIcon, screen: "trips" },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, screen: "maintenance" },
  { to: "/expenses", label: "Fuel & Expenses", icon: Fuel, screen: "expenses" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, screen: "analytics" },
  { to: "/settings", label: "Settings", icon: Settings, screen: "settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">TransitOps</div>
            <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Fleet Console</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const access = can(user?.role, item.screen);
            const isActive = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {access === "view" && (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/50">
                    View
                  </span>
                )}
                {access === "none" && (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-destructive/80">
                    Locked
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold">
              {user?.full_name?.[0] ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user?.full_name}</div>
              <div className="truncate text-xs text-sidebar-foreground/60">
                {user ? ROLE_LABEL[user.role] : ""}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
