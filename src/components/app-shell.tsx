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
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, allowedRoles: ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"] },
  { to: "/fleet", label: "Fleet", icon: Truck, allowedRoles: ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"] },
  { to: "/drivers", label: "Drivers", icon: Users, allowedRoles: ["Fleet Manager", "Dispatcher", "Safety Officer"] },
  { to: "/trips", label: "Trips", icon: RouteIcon, allowedRoles: ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"] },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, allowedRoles: ["Fleet Manager", "Safety Officer", "Financial Analyst"] },
  { to: "/fuel", label: "Fuel & Expenses", icon: Fuel, allowedRoles: ["Fleet Manager", "Financial Analyst"] },
  { to: "/analytics", label: "Analytics", icon: BarChart3, allowedRoles: ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"] },
  { to: "/settings", label: "Settings", icon: Settings, allowedRoles: ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"] },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { user, logout } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const visibleNav = nav.filter((item) => user?.role && item.allowedRoles.includes(user.role as Role));

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden md:flex md:w-60 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">T</div>
            <div>
              <div className="font-display font-bold leading-none">TransitOps</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                Ops Console
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {visibleNav.map((n) => {
            const active = location.pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-md bg-accent/50 px-3 py-2 mb-2">
            <div className="text-xs text-muted-foreground">Signed in as</div>
            <div className="text-sm font-medium truncate">{user?.email}</div>
            <div className="text-[10px] uppercase tracking-widest text-primary mt-1">
              {user?.role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center gap-3 px-4 md:px-6 bg-background/60 backdrop-blur">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search vehicles, drivers, trips…"
              className="w-full h-9 pl-9 pr-3 rounded-md bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          {title && <h1 className="text-sm font-medium text-muted-foreground hidden sm:block">{title}</h1>}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-muted-foreground">Role</span>
            <span className="status-pill border bg-primary/15 text-primary border-primary/30">
              {user?.role}
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
