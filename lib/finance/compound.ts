import { D, ZERO, num, type Dec } from "./decimal";
import { periodRate, type Compounding, type Frequency } from "./rates";

export type Timing = "begin" | "end";

export interface CompoundInput {
  principal: number;
  /** Recurring contribution per contribution period. */
  contribution: number;
  contributionFrequency: Frequency;
  timing: Timing;
  /** Nominal annual rate as a decimal (0.05 = 5%). */
  annualRate: number;
  compounding: Compounding;
  years: number;
  /** Annual increase applied to the contribution amount each year, decimal. */
  contributionGrowth?: number;
  /** Annual inflation rate, decimal, used for the real (today's dollars) balance. */
  inflation?: number;
}

export interface CompoundYearRow {
  year: number;
  contributions: number;
  interest: number;
  totalContributed: number;
  totalInterest: number;
  balance: number;
  realBalance: number;
}

export interface CompoundResult {
  futureBalance: number;
  totalContributed: number;
  totalInterest: number;
  realBalance: number;
  years: CompoundYearRow[];
}

/** Closed form A = P(1 + r/n)^(nt), continuous A = Pe^(rt). */
export function compoundClosedForm(
  principal: number,
  annualRate: number,
  compounding: Compounding,
  years: number,
): number {
  const p = new D(principal);
  const r = new D(annualRate);
  if (compounding === "continuous") return num(p.times(r.times(years).exp()));
  return num(p.times(r.div(compounding).plus(1).pow(new D(compounding).times(years))));
}

/** Closed-form future value of a level annuity: PMT·((1+i)^N − 1)/i, ×(1+i) for annuity due. */
export function annuityFutureValue(payment: number, ratePerPeriod: Dec, periods: number, timing: Timing): number {
  const pmt = new D(payment);
  if (ratePerPeriod.isZero()) return num(pmt.times(periods));
  const growth = ratePerPeriod.plus(1).pow(periods);
  let fv = pmt.times(growth.minus(1)).div(ratePerPeriod);
  if (timing === "begin") fv = fv.times(ratePerPeriod.plus(1));
  return num(fv);
}

/**
 * Simulates growth period by period (one period = one contribution period), which supports
 * contribution growth and contribution frequencies that differ from the compounding frequency.
 */
export function simulateCompound(input: CompoundInput): CompoundResult {
  const p = input.contributionFrequency;
  const i = periodRate(input.annualRate, input.compounding, p);
  const totalPeriods = Math.max(0, Math.round(input.years * p));
  const growth = new D(input.contributionGrowth ?? 0);
  const inflation = new D(input.inflation ?? 0);

  let balance = new D(input.principal);
  let totalContributed = new D(input.principal);
  let totalInterest: Dec = ZERO;
  let yearContrib: Dec = ZERO;
  let yearInterest: Dec = ZERO;
  const rows: CompoundYearRow[] = [];

  const pushRow = (year: number) => {
    rows.push({
      year,
      contributions: num(yearContrib),
      interest: num(yearInterest),
      totalContributed: num(totalContributed),
      totalInterest: num(totalInterest),
      balance: num(balance),
      realBalance: num(balance.div(inflation.plus(1).pow(year))),
    });
    yearContrib = ZERO;
    yearInterest = ZERO;
  };

  for (let k = 0; k < totalPeriods; k++) {
    const yearIndex = Math.floor(k / p);
    const contribution = new D(input.contribution).times(growth.plus(1).pow(yearIndex));

    if (input.timing === "begin") {
      balance = balance.plus(contribution);
      totalContributed = totalContributed.plus(contribution);
      yearContrib = yearContrib.plus(contribution);
    }
    const interest = balance.times(i);
    balance = balance.plus(interest);
    totalInterest = totalInterest.plus(interest);
    yearInterest = yearInterest.plus(interest);
    if (input.timing === "end") {
      balance = balance.plus(contribution);
      totalContributed = totalContributed.plus(contribution);
      yearContrib = yearContrib.plus(contribution);
    }

    const periodNumber = k + 1;
    if (periodNumber % p === 0) pushRow(periodNumber / p);
    else if (periodNumber === totalPeriods) pushRow(Math.round((periodNumber / p) * 100) / 100);
  }

  const elapsedYears = totalPeriods / p;
  return {
    futureBalance: num(balance),
    totalContributed: num(totalContributed),
    totalInterest: num(totalInterest),
    realBalance: num(balance.div(inflation.plus(1).pow(elapsedYears))),
    years: rows,
  };
}
