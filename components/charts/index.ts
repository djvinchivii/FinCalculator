"use client";

import dynamic from "next/dynamic";
import { createElement } from "react";

// Charts are code-split and client-only so Recharts never blocks first paint.
const placeholder = () => createElement("div", { className: "h-[360px] animate-pulse rounded-card border border-border bg-surface", "aria-hidden": true });

export const GrowthChart = dynamic(() => import("./GrowthChart"), { ssr: false, loading: placeholder });
export const AmortizationChart = dynamic(() => import("./AmortizationChart"), { ssr: false, loading: placeholder });
export const PayoffChart = dynamic(() => import("./PayoffChart"), { ssr: false, loading: placeholder });
export const BreakdownDonut = dynamic(() => import("./BreakdownDonut"), { ssr: false, loading: placeholder });

export type { Series } from "./GrowthChart";
export type { Slice } from "./BreakdownDonut";
export type { AmortizationYear } from "./AmortizationChart";
