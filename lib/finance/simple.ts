import { D, num } from "./decimal";

export type TimeUnit = "days" | "months" | "years";
export type DayCountBasis = 365 | 360;

export interface SimpleInterestInput {
  principal: number;
  /** Annual rate as a decimal. */
  rate: number;
  time: number;
  unit: TimeUnit;
  basis: DayCountBasis;
}

export interface SimpleInterestResult {
  interest: number;
  total: number;
  years: number;
}

/** Converts a duration to years. Day counts use the chosen basis (365 actual or 360 banker's). */
export function toYears(time: number, unit: TimeUnit, basis: DayCountBasis): number {
  if (unit === "days") return time / basis;
  if (unit === "months") return time / 12;
  return time;
}

/** I = P·r·t, total = P + I. */
export function simpleInterest(input: SimpleInterestInput): SimpleInterestResult {
  const t = new D(input.time).div(input.unit === "days" ? input.basis : input.unit === "months" ? 12 : 1);
  const interest = new D(input.principal).times(input.rate).times(t);
  return {
    interest: num(interest),
    total: num(interest.plus(input.principal)),
    years: num(t),
  };
}
