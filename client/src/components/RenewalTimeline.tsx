import { CheckCircle, Clock, Infinity as InfinityIcon, WarningCircle } from "@phosphor-icons/react";
import type { Subscription } from "@/types";
import { formatDate, formatDaysUntil, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusMeta = {
  critical: {
    icon: WarningCircle,
    dot: "bg-destructive",
    text: "text-destructive",
  },
  warning: {
    icon: Clock,
    dot: "bg-warning",
    text: "text-warning",
  },
  ok: {
    icon: CheckCircle,
    dot: "bg-success",
    text: "text-success",
  },
  on_demand: {
    icon: InfinityIcon,
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
  },
} as const;

export function RenewalTimeline({ subscriptions }: { subscriptions: Subscription[] }) {
  const sorted = [...subscriptions].sort((a, b) => {
    if (a.status === "on_demand" && b.status === "on_demand") return 0;
    if (a.status === "on_demand") return 1;
    if (b.status === "on_demand") return -1;
    return (a.daysUntil ?? 0) - (b.daysUntil ?? 0);
  });

  if (sorted.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma assinatura cadastrada.</p>;
  }

  return (
    <ol className="flex flex-col">
      {sorted.map((sub, i) => {
        const meta = statusMeta[sub.status];
        const Icon = meta.icon;
        return (
          <li
            key={sub.id}
            className={cn(
              "flex items-center gap-3 py-2.5",
              i !== sorted.length - 1 && "border-b border-border"
            )}
          >
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full bg-muted", meta.text)}>
              <Icon weight="fill" className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {sub.platform}
                <span className="ml-1.5 font-normal text-muted-foreground">{sub.subject}</span>
              </p>
              <p className={cn("text-xs", meta.text)}>
                {sub.status === "on_demand" ? "Sob demanda" : `${formatDate(sub.nextRenewalDate)} - ${formatDaysUntil(sub.daysUntil)}`}
              </p>
            </div>
            <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
              {formatMoney(sub.amount, sub.currency)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
