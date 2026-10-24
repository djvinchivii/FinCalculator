"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { LazyMount } from "./LazyMount";

// Charts are code-split, client-only, and mounted when scrolled into view, so Recharts never
// competes with first paint or hydration.
const placeholder = () => (
  <div
    className="h-[360px] animate-pulse rounded-card border border-border bg-surface"
    aria-hidden="true"
  />
);

const GrowthChartImpl = dynamic(() => import("./GrowthChart"), {
  ssr: false,
  loading: placeholder,
});
const AmortizationChartImpl = dynamic(() => import("./AmortizationChart"), {
  ssr: false,
  loading: placeholder,
});
const PayoffChartImpl = dynamic(() => import("./PayoffChart"), {
  ssr: false,
  loading: placeholder,
});
const BreakdownDonutImpl = dynamic(() => import("./BreakdownDonut"), {
  ssr: false,
  loading: placeholder,
});

export function GrowthChart(props: ComponentProps<typeof GrowthChartImpl>) {
  return (
    <LazyMount>
      <GrowthChartImpl {...props} />
    </LazyMount>
  );
}

export function AmortizationChart(props: ComponentProps<typeof AmortizationChartImpl>) {
  return (
    <LazyMount>
      <AmortizationChartImpl {...props} />
    </LazyMount>
  );
}

export function PayoffChart(props: ComponentProps<typeof PayoffChartImpl>) {
  return (
    <LazyMount>
      <PayoffChartImpl {...props} />
    </LazyMount>
  );
}

export function BreakdownDonut(props: ComponentProps<typeof BreakdownDonutImpl>) {
  return (
    <LazyMount minHeight={300}>
      <BreakdownDonutImpl {...props} />
    </LazyMount>
  );
}

export type { Series } from "./GrowthChart";
export type { Slice } from "./BreakdownDonut";
export type { AmortizationYear } from "./AmortizationChart";
