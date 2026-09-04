import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMoney } from "@/lib/format";
import type { Subscription } from "@/types";

const MAX_SLOTS = 8;

/** Documented reference categorical palette (validated adjacent-pair CVD safe), see dataviz skill palette.md. */
const CATEGORICAL_PALETTE: { light: string; dark: string }[] = [
  { light: "#2a78d6", dark: "#3987e5" },
  { light: "#008300", dark: "#008300" },
  { light: "#e87ba4", dark: "#d55181" },
  { light: "#eda100", dark: "#c98500" },
  { light: "#1baf7a", dark: "#199e70" },
  { light: "#eb6834", dark: "#d95926" },
  { light: "#4a3aa7", dark: "#9085e9" },
  { light: "#e34948", dark: "#e66767" },
];
const OTHER_COLOR = { light: "#898781", dark: "#898781" };

export function categoryLabel(subject: string) {
  const trimmed = subject.trim();
  if (!trimmed) return "Outros";
  const label = trimmed.split(" - ")[0].split(",")[0].trim();
  return label || "Outros";
}

function monthlyEquivalent(sub: Subscription) {
  if (sub.amount == null || sub.currency !== "BRL") return 0;
  if (sub.billingCycle === "mensal") return sub.amount;
  if (sub.billingCycle === "anual") return sub.amount / 12;
  return 0;
}

/**
 * Stable slot per category, ranked by total monthly spend across the FULL unfiltered
 * dataset (not by filtered subset) so a filter never repaints a survivor's color, and
 * the 8 real color slots go to the biggest categories rather than an arbitrary order.
 */
export function buildCategorySlots(allSubscriptions: Subscription[]) {
  const totals = new Map<string, number>();
  for (const s of allSubscriptions) {
    const cat = categoryLabel(s.subject);
    totals.set(cat, (totals.get(cat) ?? 0) + monthlyEquivalent(s));
  }
  const categories = [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .map(([label]) => label);

  const slots = new Map<string, number>();
  categories.forEach((c, i) => slots.set(c, i));
  return slots;
}

interface CompositionItem {
  key: string;
  label: string;
  value: number;
  color: { light: string; dark: string };
}

function buildComposition(
  subscriptions: Subscription[],
  slots: Map<string, number>
): CompositionItem[] {
  const totals = new Map<string, number>();
  for (const s of subscriptions) {
    const value = monthlyEquivalent(s);
    if (value <= 0) continue;
    const cat = categoryLabel(s.subject);
    totals.set(cat, (totals.get(cat) ?? 0) + value);
  }

  const items: CompositionItem[] = [];
  let otherTotal = 0;

  for (const [label, value] of totals.entries()) {
    const slot = slots.get(label) ?? MAX_SLOTS;
    if (slot >= MAX_SLOTS) {
      otherTotal += value;
    } else {
      items.push({ key: `cat${slot}`, label, value, color: CATEGORICAL_PALETTE[slot] });
    }
  }

  if (otherTotal > 0) {
    items.push({ key: "catOther", label: "Outros", value: otherTotal, color: OTHER_COLOR });
  }

  return items.sort((a, b) => b.value - a.value);
}

interface SpendCompositionBarProps {
  subscriptions: Subscription[];
  allSubscriptions: Subscription[];
  emptyMessage?: string;
}

export function SpendCompositionBar({
  subscriptions,
  allSubscriptions,
  emptyMessage,
}: SpendCompositionBarProps) {
  const slots = buildCategorySlots(allSubscriptions);
  const composition = buildComposition(subscriptions, slots);
  const total = composition.reduce((sum, c) => sum + c.value, 0);

  if (composition.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage ?? "Sem dados para exibir."}
      </p>
    );
  }

  const chartConfig: ChartConfig = Object.fromEntries(
    composition.map((c) => [c.key, { label: c.label, theme: c.color }])
  );
  const row: Record<string, string | number> = { name: "total" };
  composition.forEach((c) => {
    row[c.key] = c.value;
  });

  return (
    <div>
      <ChartContainer config={chartConfig} className="aspect-auto w-full" style={{ height: 64 }}>
        <BarChart data={[row]} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" hide />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, _name, item) => {
                  const entry = composition.find((c) => c.key === item?.dataKey);
                  if (!entry) return null;
                  const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0;
                  return (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span
                          className="size-2 shrink-0 rounded-[2px]"
                          style={{ background: `var(--color-${item?.dataKey})` }}
                        />
                        {entry.label}
                      </span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {formatMoney(Number(value))}
                        <span className="ml-1.5 text-muted-foreground">({pct}%)</span>
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          {composition.map((c) => (
            <Bar
              key={c.key}
              dataKey={c.key}
              stackId="spend"
              fill={`var(--color-${c.key})`}
              stroke="var(--card)"
              strokeWidth={2}
            />
          ))}
        </BarChart>
      </ChartContainer>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {composition.map((c) => {
          const pct = total > 0 ? Math.round((c.value / total) * 100) : 0;
          return (
            <li key={c.key} className="flex items-center gap-1.5 text-xs">
              <span
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ background: `var(--color-${c.key})` }}
              />
              <span className="text-foreground">{c.label}</span>
              <span className="text-muted-foreground">
                {formatMoney(c.value)} - {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
