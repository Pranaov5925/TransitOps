import { ShieldAlert } from "lucide-react";

export function NotAuthorized({ screen }: { screen: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Not authorized</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your role does not have access to <span className="font-medium">{screen}</span>. Contact your fleet
          manager if you believe this is a mistake.
        </p>
      </div>
    </div>
  );
}
