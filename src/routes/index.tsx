import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("transitops.token");
    throw redirect({ to: token ? "/dashboard" : "/auth" });
  },
  component: () => null,
});
