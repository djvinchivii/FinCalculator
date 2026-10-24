"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { ChartFrame } from "./ChartFrame";

export interface Series {
  key: string;
  label: string;
  /** CSS color, e.g. "rgb(var(--chart-1))". */
  color: string;
  dashed?: boolean;
}

export interface GrowthChartProps {
  title: string;
  data: Record<string, number | string | null>[];
  xKey: string;
  xLabel: string;
  series: Series[];
  /** "stacked-area" (default), "area" (overlapping) or "line". */
  variant?: "stacked-area" | "area" | "line";
  formatValue?: (v: number) => string;
  formatAxis?: (v: number) => string;
  formatX?: (v: string | number) => string;
  height?: number;
}

/** Generic time-series chart (stacked area for contributions vs interest, lines for comparisons). */
export default function GrowthChart({
  title,
  data,
  xKey,
  xLabel,
  series,
  variant = "stacked-area",
  formatValue = formatCurrency,
  formatAxis = formatCurrencyCompact,
  formatX = (v) => String(v),
  height = 300,
}: GrowthChartProps) {
  const common = {
    data,
    margin: { top: 8, right: 8, bottom: 0, left: 0 },
  };
  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey={xKey}
        tickFormatter={formatX}
        tickLine={false}
        axisLine={false}
        minTickGap={24}
      />
      <YAxis
        tickFormatter={(v: number) => formatAxis(v)}
        tickLine={false}
        axisLine={false}
        width={64}
      />
      <Tooltip
        formatter={(value) => formatValue(Number(value))}
        labelFormatter={(label) => `${xLabel} ${formatX(label as string | number)}`}
        contentStyle={{
          background: "rgb(var(--surface))",
          border: "1px solid rgb(var(--border))",
          borderRadius: 8,
          color: "rgb(var(--ink))",
        }}
      />
      <Legend wrapperStyle={{ fontSize: 13 }} />
    </>
  );

  return (
    <ChartFrame
      title={title}
      data={data}
      xKey={xKey}
      xLabel={xLabel}
      height={height}
      columns={series.map((s) => ({ key: s.key, label: s.label, format: formatValue }))}
    >
      <ResponsiveContainer width="100%" height="100%">
        {variant === "line" ? (
          <LineChart {...common}>
            {axes}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2.5}
                strokeDasharray={s.dashed ? "6 4" : undefined}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        ) : (
          <AreaChart {...common}>
            {axes}
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stackId={variant === "stacked-area" ? "1" : undefined}
                stroke={s.color}
                fill={s.color}
                fillOpacity={variant === "stacked-area" ? 0.75 : 0.25}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </ChartFrame>
  );
}
