import { D, ONE, type Dec } from "./decimal";

/** Compounding periods per year, or continuous compounding. */
export type Compounding = 1 | 2 | 4 | 12 | 26 | 52 | 365 | "continuous";

export const COMPOUNDING_OPTIONS: { value: Compounding; label: string }[] = [
  { value: 1, label: "Annually" },
  { value: 2, label: "Semi-annually" },
  { value: 4, label: "Quarterly" },
  { value: 12, label: "Monthly" },
  { value: 26, label: "Bi-weekly" },
  { value: 52, label: "Weekly" },
  { value: 365, label: "Daily" },
  { value: "continuous", label: "Continuous" },
];

/** Contribution / payment frequencies (periods per year). */
export type Frequency = 1 | 2 | 4 | 12 | 26 | 52;

export const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 1, label: "Annually" },
  { value: 2, label: "Semi-annually" },
  { value: 4, label: "Quarterly" },
  { value: 12, label: "Monthly" },
  { value: 26, label: "Bi-weekly" },
  { value: 52, label: "Weekly" },
];

/**
 * Effective rate per contribution period for a nominal annual rate compounded `n` times a year,
 * when contributions happen `p` times a year: (1 + r/n)^(n/p) − 1, continuous: e^(r/p) − 1.
 */
export function periodRate(
  annualRate: number,
  compounding: Compounding,
  periodsPerYear: number,
): Dec {
  const r = new D(annualRate);
  if (r.isZero()) return new D(0);
  if (compounding === "continuous") return r.div(periodsPerYear).exp().minus(1);
  return r.div(compounding).plus(1).pow(new D(compounding).div(periodsPerYear)).minus(1);
}

/** APY from a nominal APR: (1 + APR/n)^n − 1, continuous: e^APR − 1. */
export function aprToApy(apr: number, compounding: Compounding): number {
  return periodRate(apr, compounding, 1).toNumber();
}

/** Nominal APR from an APY: n((1 + APY)^(1/n) − 1), continuous: ln(1 + APY). */
export function apyToApr(apy: number, compounding: Compounding): number {
  const y = new D(apy).plus(1);
  if (compounding === "continuous") return y.ln().toNumber();
  return y.pow(ONE.div(compounding)).minus(1).times(compounding).toNumber();
}

/** Rule of 72 estimate of doubling time in years (rate as decimal, e.g. 0.08). */
export function ruleOf72(rate: number): number | null {
  if (rate <= 0) return null;
  return 72 / (rate * 100);
}

/** Exact doubling time in years for annual compounding: ln 2 / ln(1 + r). */
export function exactDoublingTime(rate: number): number | null {
  if (rate <= 0) return null;
  return new D(2).ln().div(new D(rate).plus(1).ln()).toNumber();
}
