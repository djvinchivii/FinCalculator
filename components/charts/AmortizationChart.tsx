"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { ChartFrame } from "./ChartFrame";

export interface AmortizationYear {
  year: number;
  principal: number;
  interest: number;
  balance: number;
}

/** Principal vs interest paid each year (stacked bars) with the remaining balance as a line. */
export default function AmortizationChart({
  data,
  title = "Principal vs. interest by year",
}: {
  data: AmortizationYear[];
  title?: string;
}) {
  return (
    <ChartFrame
      title={title}
      data={data as unknown as Record<string, number>[]}
      xKey="year"
      xLabel="Year"
      columns={[
        { key: "principal", label: "Principal", format: formatCurrency },
        { key: "interest", label: "Interest", format: formatCurrency },
        { key: "balance", label: "Balance", format: formatCurrency },
      ]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis
            yAxisId="pay"
            tickFormatter={(v: number) => formatCurrencyCompact(v)}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <YAxis
            yAxisId="bal"
            orientation="right"
            tickFormatter={(v: number) => formatCurrencyCompact(v)}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => `Year ${String(label)}`}
            contentStyle={{
              background: "rgb(var(--surface))",
              border: "1px solid rgb(var(--border))",
              borderRadius: 8,
              color: "rgb(var(--ink))",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Bar
            yAxisId="pay"
            dataKey="principal"
            name="Principal"
            stackId="p"
            fill="rgb(var(--chart-1))"
            isAnimationActive={false}
          />
          <Bar
            yAxisId="pay"
            dataKey="interest"
            name="Interest"
            stackId="p"
            fill="rgb(var(--chart-3))"
            isAnimationActive={false}
          />
          <Line
            yAxisId="bal"
            dataKey="balance"
            name="Balance"
            stroke="rgb(var(--chart-2))"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
