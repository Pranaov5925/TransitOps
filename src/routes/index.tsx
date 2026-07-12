import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  useEffect(() => {
    const raw =
      typeof window !== "undefined" ? window.localStorage.getItem("transitops.user") : null;
    window.location.replace(raw ? "/dashboard" : "/login");
  }, []);
  return (
    <div className="min-h-screen grid place-items-center bg-background text-muted-foreground text-sm">
      Loading TransitOps…
    </div>
  );
}
