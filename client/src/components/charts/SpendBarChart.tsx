import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMoney } from "@/lib/format";

export interface SpendBarDatum {
  id: string;
  label: string;
  value: number;
}

interface SpendBarChartProps {
  data: SpendBarDatum[];
  emptyMessage?: string;
}

const chartConfig = {
  value: {
    label: "Gasto mensal",
    theme: { light: "#4d590d", dark: "#a3b93a" },
  },
} satisfies ChartConfig;

export function SpendBarChart({ data, emptyMessage }: SpendBarChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage ?? "Sem dados para exibir."}
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.value));

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto w-full"
      style={{ height: data.length * 34 + 24 }}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 4, right: 56, top: 4, bottom: 4 }}
        barCategoryGap={8}
      >
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, max * 1.12]} hide />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          axisLine={false}
          width={112}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {(item?.payload as SpendBarDatum | undefined)?.label}
                  </span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {formatMoney(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} barSize={12}>
          <LabelList
            dataKey="value"
            position="right"
            className="fill-foreground text-xs font-medium tabular-nums"
            formatter={(value: unknown) =>
              typeof value === "number" ? formatMoney(value) : ""
            }
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
