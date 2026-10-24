import { D, num } from "./decimal";
import { periodRate, type Compounding, type Frequency } from "./rates";
import type { Timing } from "./compound";

export interface SavingsGoalBase {
  target: number;
  current: number;
  annualRate: number;
  compounding: Compounding;
  contributionFrequency: Frequency;
  timing: Timing;
}

export interface SolveContributionInput extends SavingsGoalBase {
  years: number;
}

export interface SolveContributionResult {
  /** Exact required contribution per period (full precision). */
  contribution: number;
  /** Contribution rounded up to the next cent so the goal is guaranteed. */
  contributionRounded: number;
  periods: number;
  totalContributed: number;
  interestEarned: number;
  alreadyOnTrack: boolean;
}

/**
 * PMT = (FV − PV(1+i)^N) · i / ((1+i)^N − 1), divided by (1+i) for beginning-of-period deposits.
 * i = 0 → (FV − PV) / N.
 */
export function solveContribution(input: SolveContributionInput): SolveContributionResult {
  const p = input.contributionFrequency;
  const n = Math.max(1, Math.round(input.years * p));
  const i = periodRate(input.annualRate, input.compounding, p);
  const fv = new D(input.target);
  const pv = new D(input.current);
  const growth = i.plus(1).pow(n);
  const shortfall = fv.minus(pv.times(growth));

  if (shortfall.lte(0)) {
    return {
      contribution: 0,
      contributionRounded: 0,
      periods: n,
      totalContributed: num(pv),
      interestEarned: num(pv.times(growth).minus(pv)),
      alreadyOnTrack: true,
    };
  }

  let pmt = i.isZero() ? shortfall.div(n) : shortfall.times(i).div(growth.minus(1));
  if (input.timing === "begin" && !i.isZero()) pmt = pmt.div(i.plus(1));
  const rounded = pmt.toDecimalPlaces(2, D.ROUND_UP);
  const totalContributed = pv.plus(pmt.times(n));
  return {
    contribution: num(pmt),
    contributionRounded: num(rounded),
    periods: n,
    totalContributed: num(totalContributed),
    interestEarned: num(fv.minus(totalContributed)),
    alreadyOnTrack: false,
  };
}

export interface SolveTimeInput extends SavingsGoalBase {
  contribution: number;
}

export interface SolveTimeResult {
  /** Exact number of contribution periods (fractional), or null if the goal is unreachable. */
  periods: number | null;
  /** Whole periods needed (rounded up). */
  periodsWhole: number | null;
  months: number | null;
  years: number | null;
  reachable: boolean;
}

/**
 * N = ln((FV·i + PMT) / (PV·i + PMT)) / ln(1 + i), with PMT·(1+i) for beginning-of-period deposits.
 * i = 0 → (FV − PV) / PMT.
 */
export function solveTime(input: SolveTimeInput): SolveTimeResult {
  const p = input.contributionFrequency;
  const i = periodRate(input.annualRate, input.compounding, p);
  const fv = new D(input.target);
  const pv = new D(input.current);
  const unreachable: SolveTimeResult = {
    periods: null,
    periodsWhole: null,
    months: null,
    years: null,
    reachable: false,
  };

  const done = (periods: number): SolveTimeResult => {
    const whole = Math.ceil(periods - 1e-9);
    return {
      periods,
      periodsWhole: whole,
      months: (whole / p) * 12,
      years: whole / p,
      reachable: true,
    };
  };

  if (pv.gte(fv)) return done(0);

  let pmt = new D(input.contribution);
  if (i.isZero()) {
    if (pmt.lte(0)) return unreachable;
    return done(num(fv.minus(pv).div(pmt)));
  }
  if (input.timing === "begin") pmt = pmt.times(i.plus(1));
  const numerator = fv.times(i).plus(pmt);
  const denominator = pv.times(i).plus(pmt);
  if (denominator.lte(0) || numerator.lte(0)) return unreachable;
  const periods = numerator.div(denominator).ln().div(i.plus(1).ln());
  if (!periods.isFinite() || periods.lt(0)) return unreachable;
  return done(num(periods));
}
