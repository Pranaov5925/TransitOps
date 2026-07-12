import { ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card border border-border rounded-lg max-w-xl mx-auto my-10 space-y-4">
      <div className="h-16 w-16 rounded-full bg-destructive/15 grid place-items-center text-destructive">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h2 className="font-display font-semibold text-xl text-foreground">Access Denied</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        Your user role does not have permission to access this operational module. Please contact
        your administrator or switch roles.
      </p>
      <div className="pt-2">
        <Link
          to="/settings"
          className="inline-flex h-9 px-4 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110"
        >
          Go to Settings
        </Link>
      </div>
    </div>
  );
}
