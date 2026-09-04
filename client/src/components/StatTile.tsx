import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "warning" | "critical";
}

const toneClasses: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "text-foreground",
  warning: "text-warning",
  critical: "text-destructive",
};

export function StatTile({ label, value, hint, icon, tone = "default" }: StatTileProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className={cn("mt-2 text-3xl font-semibold tabular-nums", toneClasses[tone])}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
