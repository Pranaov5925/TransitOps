import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthedLayout,
});

function AuthedLayout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Read directly from storage on first mount to avoid a redirect flicker
    // before the AuthProvider hydrates.
    const token = typeof window !== "undefined" ? window.localStorage.getItem("transitops.token") : null;
    if (!token && !isAuthenticated) {
      navigate({ to: "/auth", replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
