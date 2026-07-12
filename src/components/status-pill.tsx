import { cn } from "@/lib/utils";

type Tone = "success" | "info" | "warning" | "destructive" | "muted";

const toneStyles: Record<Tone, string> = {
  success: "bg-success/15 text-success border-success/30",
  info: "bg-info/15 text-info border-info/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  destructive: "bg-destructive/15 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
};

const map: Record<string, Tone> = {
  Available: "success",
  "On Trip": "info",
  "In Shop": "warning",
  Retired: "destructive",
  "Off Duty": "muted",
  Suspended: "destructive",
  Draft: "muted",
  Dispatched: "info",
  Completed: "success",
  Cancelled: "destructive",
  Open: "warning",
  Closed: "success",
};

export function StatusPill({ value, className }: { value: string; className?: string }) {
  const tone = map[value] ?? "muted";
  return <span className={cn("status-pill border", toneStyles[tone], className)}>{value}</span>;
}
