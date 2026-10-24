"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, formatPercent } from "@/lib/format";

export interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

/** Donut chart with a legend that doubles as the accessible data table. */
export default function BreakdownDonut({ title, slices, centerLabel, centerValue }: { title: string; slices: Slice[]; centerLabel: string; centerValue: string }) {
  const visible = slices.filter((s) => s.value > 0);
  const total = visible.reduce((s, x) => s + x.value, 0);
  return (
    <figure className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-6">
      <figcaption className="mb-3 text-lg font-semibold">{title}</figcaption>
      <div className="grid items-center gap-6 sm:grid-cols-2">
        <div aria-hidden="true" className="relative h-56 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={visible} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="95%" paddingAngle={1.5} stroke="none" isAnimationActive={false}>
                {visible.map((s) => (
                  <Cell key={s.key} fill={s.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 8, color: "rgb(var(--ink))" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-xs text-ink-muted">{centerLabel}</div>
              <div className="text-lg font-bold tabular-nums">{centerValue}</div>
            </div>
          </div>
        </div>
        <table className="w-full text-sm tabular-nums">
          <caption className="sr-only">{title}</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Amount</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {slices.map((s) => (
              <tr key={s.key} className="border-b border-border/60 last:border-0">
                <th scope="row" className="py-2 text-left font-normal">
                  <span className="mr-2 inline-block h-3 w-3 rounded-sm align-middle" style={{ background: s.color }} aria-hidden="true" />
                  {s.label}
                </th>
                <td className="py-2 text-right font-semibold">{formatCurrency(s.value)}</td>
                <td className="py-2 pl-3 text-right text-ink-muted">{total > 0 ? formatPercent(s.value / total, 0) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
