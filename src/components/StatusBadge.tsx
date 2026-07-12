import { cn } from "@/lib/utils";

const MAP: Record<string, string> = {
  Available: "bg-success/15 text-success border-success/30",
  "On Trip": "bg-info/15 text-info border-info/30",
  "In Shop": "bg-warning/15 text-warning-foreground border-warning/40",
  Retired: "bg-muted text-muted-foreground border-border",
  Active: "bg-success/15 text-success border-success/30",
  "Off Duty": "bg-muted text-muted-foreground border-border",
  Suspended: "bg-destructive/15 text-destructive border-destructive/30",
  Draft: "bg-muted text-muted-foreground border-border",
  Dispatched: "bg-info/15 text-info border-info/30",
  Completed: "bg-success/15 text-success border-success/30",
  Cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  Open: "bg-warning/15 text-warning-foreground border-warning/40",
  Closed: "bg-success/15 text-success border-success/30",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = MAP[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        style,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
