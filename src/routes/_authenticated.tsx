import { Outlet, createFileRoute, redirect, useLocation } from "@tanstack/react-router";
import { StoreProvider, useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

const allowedRoutes: Record<Role, string[]> = {
  "Fleet Manager": ["/dashboard", "/fleet", "/drivers", "/trips", "/maintenance", "/fuel", "/analytics", "/settings"],
  Dispatcher: ["/dashboard", "/fleet", "/drivers", "/trips", "/analytics", "/settings"],
  "Safety Officer": ["/dashboard", "/fleet", "/drivers", "/trips", "/maintenance", "/analytics", "/settings"],
  "Financial Analyst": ["/dashboard", "/fleet", "/trips", "/maintenance", "/fuel", "/analytics", "/settings"],
};

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <StoreProvider>
      <Gate />
    </StoreProvider>
  );
}

function Gate() {
  const { user } = useStore();
  const location = useLocation();
  if (!user) {
    // client-only redirect
    if (typeof window !== "undefined") window.location.replace("/login");
    return null;
  }
  if (!allowedRoutes[user.role].some((route) => location.pathname === route || location.pathname.startsWith(`${route}/`))) {
    if (typeof window !== "undefined") window.location.replace("/dashboard");
    return null;
  }
  return <Outlet />;
}

// keep redirect import used to appease TS if needed
void redirect;
