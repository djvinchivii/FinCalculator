"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { ChartFrame } from "./ChartFrame";

const COLORS = [1, 2, 3, 4, 5, 6].map((n) => `rgb(var(--chart-${n}))`);

/** Month-by-month balance of each debt, stacked. */
export default function PayoffChart({
  data,
  debts,
  title = "Balances month by month",
}: {
  data: Record<string, number>[];
  debts: { id: string; name: string }[];
  title?: string;
}) {
  return (
    <ChartFrame
      title={title}
      data={data}
      xKey="month"
      xLabel="Month"
      columns={debts.map((d) => ({ key: d.id, label: d.name, format: formatCurrency }))}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tickFormatter={(v: number) => formatCurrencyCompact(v)} tickLine={false} axisLine={false} width={60} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => `Month ${String(label)}`}
            contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 8, color: "rgb(var(--ink))" }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          {debts.map((d, i) => (
            <Area
              key={d.id}
              type="monotone"
              dataKey={d.id}
              name={d.name}
              stackId="1"
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.7}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
