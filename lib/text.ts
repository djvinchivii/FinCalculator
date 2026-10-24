/** Small helpers for plain-English result summaries. */
import { formatNumber } from "./format";

const PER: Record<number, string> = {
  1: "a year",
  2: "every six months",
  4: "a quarter",
  12: "a month",
  24: "twice a month",
  26: "every two weeks",
  52: "a week",
  365: "a day",
};

export function perPeriod(periodsPerYear: number): string {
  return PER[periodsPerYear] ?? `${periodsPerYear} times a year`;
}

const PERIOD_NOUN: Record<number, string> = {
  1: "year",
  2: "half-year",
  4: "quarter",
  12: "month",
  24: "half-month",
  26: "two weeks",
  52: "week",
};

export function periodNoun(periodsPerYear: number): string {
  return PERIOD_NOUN[periodsPerYear] ?? "period";
}

export function yearsPhrase(years: number): string {
  return `${formatNumber(years, 2)} ${years === 1 ? "year" : "years"}`;
}

export function pctPhrase(rateDecimal: number): string {
  return `${formatNumber(rateDecimal * 100, 3)}%`;
}
