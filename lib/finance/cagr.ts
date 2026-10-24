import { D, num } from "./decimal";

/** CAGR = (End / Start)^(1 / years) − 1. Returns null when undefined (start ≤ 0, years ≤ 0, end < 0). */
export function cagr(start: number, end: number, years: number): number | null {
  if (start <= 0 || years <= 0 || end < 0) return null;
  return num(new D(end).div(start).pow(new D(1).div(years)).minus(1));
}

export interface CagrPoint {
  year: number;
  actual: number | null;
  smooth: number;
  yearReturn: number | null;
}

export interface CagrSeriesResult {
  cagr: number | null;
  points: CagrPoint[];
  /** Arithmetic mean of yearly returns. */
  averageReturn: number | null;
  /** Sample standard deviation of yearly returns (volatility). */
  volatility: number | null;
  bestYear: number | null;
  worstYear: number | null;
}

/**
 * With yearly values v0..vN, compares the actual path to a smooth line growing at the CAGR.
 */
export function cagrSeries(values: number[]): CagrSeriesResult {
  const first = values[0];
  const last = values[values.length - 1];
  const years = values.length - 1;
  const rate = first !== undefined && last !== undefined ? cagr(first, last, years) : null;
  const returns: number[] = [];
  const points: CagrPoint[] = values.map((v, k) => {
    const prev = k > 0 ? values[k - 1] : undefined;
    const yearReturn = prev !== undefined && prev > 0 ? v / prev - 1 : null;
    if (yearReturn !== null) returns.push(yearReturn);
    return {
      year: k,
      actual: v,
      smooth:
        rate !== null && first !== undefined
          ? num(new D(first).times(new D(rate).plus(1).pow(k)))
          : v,
      yearReturn,
    };
  });
  const mean = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : null;
  const volatility =
    mean !== null && returns.length > 1
      ? Math.sqrt(returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1))
      : null;
  return {
    cagr: rate,
    points,
    averageReturn: mean,
    volatility,
    bestYear: returns.length ? Math.max(...returns) : null,
    worstYear: returns.length ? Math.min(...returns) : null,
  };
}
