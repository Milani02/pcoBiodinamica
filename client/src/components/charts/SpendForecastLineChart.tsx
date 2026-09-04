import { Area, AreaChart, CartesianGrid, ReferenceDot, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMoney } from "@/lib/format";
import type { Subscription } from "@/types";

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

interface ForecastDatum {
  key: string;
  label: string;
  value: number;
}

/**
 * Projects the next 12 months of BRL spend: monthly subscriptions contribute
 * every month, annual subscriptions contribute once, in their renewal month
 * (so the line shows the cash-flow spikes annual renewals create). Sob-demanda
 * subscriptions are excluded, same as the other spend aggregations - they have
 * no predictable cadence to project.
 */
function buildForecast(subscriptions: Subscription[], today: Date): ForecastDatum[] {
  const monthlyBase = subscriptions
    .filter((s) => s.currency === "BRL" && s.billingCycle === "mensal" && s.amount != null)
    .reduce((sum, s) => sum + (s.amount ?? 0), 0);

  const annual = subscriptions.filter(
    (s) => s.currency === "BRL" && s.billingCycle === "anual" && s.amount != null
  );

  const start = new Date(today.getFullYear(), today.getMonth(), 1);

  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    let value = monthlyBase;
    for (const s of annual) {
      const renewalSource = s.nextRenewalDate ?? s.recurrenceDate;
      if (!renewalSource) continue;
      if (new Date(`${renewalSource}T00:00:00`).getMonth() === d.getMonth()) {
        value += s.amount ?? 0;
      }
    }
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: `${MONTH_LABELS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      value,
    };
  });
}

function compactMoney(value: number) {
  if (value >= 1000) {
    const thousands = value / 1000;
    return `R$ ${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
  }
  return formatMoney(value);
}

const chartConfig = {
  value: {
    label: "Gasto projetado",
    theme: { light: "#4d590d", dark: "#a3b93a" },
  },
} satisfies ChartConfig;

interface SpendForecastLineChartProps {
  subscriptions: Subscription[];
  emptyMessage?: string;
}

export function SpendForecastLineChart({ subscriptions, emptyMessage }: SpendForecastLineChartProps) {
  const data = buildForecast(subscriptions, new Date());
  const max = Math.max(...data.map((d) => d.value));

  if (max <= 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage ?? "Sem dados para exibir."}
      </p>
    );
  }

  const last = data[data.length - 1];

  return (
    <ChartContainer config={chartConfig} className="aspect-auto w-full" style={{ height: 240 }}>
      <AreaChart data={data} margin={{ left: 4, right: 32, top: 20, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          domain={[0, max * 1.2]}
          tickFormatter={(value: number) => compactMoney(value)}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              hideLabel
              indicator="line"
              formatter={(value, _name, item) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {(item?.payload as ForecastDatum | undefined)?.label}
                  </span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {formatMoney(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2}
          fill="var(--color-value)"
          fillOpacity={0.1}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
        />
        <ReferenceDot
          x={last.label}
          y={last.value}
          r={4}
          fill="var(--color-value)"
          stroke="var(--card)"
          strokeWidth={2}
          label={{
            value: formatMoney(last.value),
            position: "top",
            offset: 10,
            className: "fill-foreground text-xs font-medium tabular-nums",
          }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
