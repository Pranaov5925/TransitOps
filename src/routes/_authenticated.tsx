import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { StoreProvider, useStore } from "@/lib/store";

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
  if (!user) {
    // client-only redirect
    if (typeof window !== "undefined") window.location.replace("/login");
    return null;
  }
  return <Outlet />;
}

// keep redirect import used to appease TS if needed
void redirect;
