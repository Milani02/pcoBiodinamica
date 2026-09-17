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

const iconChipClasses: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

export function StatTile({ label, value, hint, icon, tone = "default" }: StatTileProps) {
  return (
    <div className="panel">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && (
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", iconChipClasses[tone])}>
            {icon}
          </span>
        )}
      </div>
      <p className={cn("mt-3 text-3xl font-semibold tracking-tight tabular-nums", toneClasses[tone])}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
