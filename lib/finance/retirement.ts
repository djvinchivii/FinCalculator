import { D, ZERO, num, type Dec } from "./decimal";

export interface RetirementInput {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  /** Expected annual return before retirement (decimal, effective annual). */
  preReturn: number;
  /** Expected annual return during retirement (decimal, effective annual). */
  postReturn: number;
  inflation: number;
  /** Desired annual spending in today's dollars. */
  annualSpending: number;
  /** Safe withdrawal rate (decimal), default 0.04. */
  withdrawalRate: number;
}

export interface RetirementYearRow {
  age: number;
  phase: "saving" | "retired";
  contributions: number;
  withdrawals: number;
  growth: number;
  balance: number;
  realBalance: number;
}

export interface RetirementResult {
  nestEgg: number;
  nestEggReal: number;
  /** FIRE number in today's dollars: annual spending / withdrawal rate. */
  fireNumber: number;
  /** FIRE number in nominal dollars at retirement age. */
  fireNumberAtRetirement: number;
  /** Age at which the (inflation-adjusted) balance first reaches the FIRE number, or null by age 100. */
  fireAge: number | null;
  onTrack: boolean;
  /** Age when the money runs out in retirement, or null if it lasts past `HORIZON_AGE`. */
  depletionAge: number | null;
  yearsLasting: number | null;
  firstYearSpendingNominal: number;
  totalContributed: number;
  rows: RetirementYearRow[];
}

export const HORIZON_AGE = 120;
const FIRE_SEARCH_AGE = 100;

function monthlyRate(annual: number): Dec {
  return new D(annual).plus(1).pow(new D(1).div(12)).minus(1);
}

function deflator(inflation: number, years: number): Dec {
  return new D(inflation).plus(1).pow(years);
}

export function projectRetirement(input: RetirementInput): RetirementResult {
  const accumulationMonths = Math.max(0, Math.round((input.retirementAge - input.currentAge) * 12));
  const preRate = monthlyRate(input.preReturn);
  const postRate = monthlyRate(input.postReturn);
  const contribution = new D(input.monthlyContribution);
  const fireNumber =
    input.withdrawalRate > 0 ? num(new D(input.annualSpending).div(input.withdrawalRate)) : 0;

  const rows: RetirementYearRow[] = [];
  let balance = new D(input.currentSavings);
  let totalContributed = new D(input.currentSavings);
  let yContrib: Dec = ZERO;
  let yWithdraw: Dec = ZERO;
  let yGrowth: Dec = ZERO;
  const pushRow = (monthsElapsed: number, phase: RetirementYearRow["phase"]) => {
    const yearsElapsed = monthsElapsed / 12;
    rows.push({
      age: Math.round((input.currentAge + yearsElapsed) * 100) / 100,
      phase,
      contributions: num(yContrib),
      withdrawals: num(yWithdraw),
      growth: num(yGrowth),
      balance: num(balance),
      realBalance: num(balance.div(deflator(input.inflation, yearsElapsed))),
    });
    yContrib = ZERO;
    yWithdraw = ZERO;
    yGrowth = ZERO;
  };

  // Accumulation: monthly growth, end-of-month contributions.
  for (let m = 1; m <= accumulationMonths; m++) {
    const growth = balance.times(preRate);
    balance = balance.plus(growth).plus(contribution);
    totalContributed = totalContributed.plus(contribution);
    yContrib = yContrib.plus(contribution);
    yGrowth = yGrowth.plus(growth);
    if (m % 12 === 0 || m === accumulationMonths) pushRow(m, "saving");
  }
  const nestEgg = balance;
  const yearsToRetirement = accumulationMonths / 12;

  // FIRE age: keep accumulating (hypothetically) until real balance ≥ FIRE number.
  let fireAge: number | null = null;
  if (fireNumber > 0) {
    let b = new D(input.currentSavings);
    // Compare in today's dollars: the FIRE target grows with inflation month by month.
    let target = new D(fireNumber);
    const monthlyInflation = deflator(input.inflation, 1 / 12);
    const maxMonths = Math.max(0, Math.round((FIRE_SEARCH_AGE - input.currentAge) * 12));
    for (let m = 0; m <= maxMonths; m++) {
      if (m > 0) {
        b = b.plus(b.times(preRate)).plus(contribution);
        target = target.times(monthlyInflation);
      }
      if (b.gte(target)) {
        fireAge = Math.round((input.currentAge + m / 12) * 10) / 10;
        break;
      }
    }
  }

  // Drawdown: withdraw inflation-adjusted spending at the start of each month.
  const firstYearSpending = new D(input.annualSpending).times(
    deflator(input.inflation, yearsToRetirement),
  );
  const drawdownMonths = Math.max(0, Math.round((HORIZON_AGE - input.retirementAge) * 12));
  let depletionMonth: number | null = null;
  const annualInflation = new D(input.inflation).plus(1);
  let monthlySpending = firstYearSpending.div(12);
  for (let m = 1; m <= drawdownMonths; m++) {
    if (m > 1 && (m - 1) % 12 === 0) monthlySpending = monthlySpending.times(annualInflation);
    const withdrawal = D.min(balance, monthlySpending);
    balance = balance.minus(withdrawal);
    yWithdraw = yWithdraw.plus(withdrawal);
    const growth = balance.times(postRate);
    balance = balance.plus(growth);
    yGrowth = yGrowth.plus(growth);
    const depleted = balance.lte(0.005);
    if (depleted) balance = ZERO;
    if (m % 12 === 0 || depleted || m === drawdownMonths)
      pushRow(accumulationMonths + m, "retired");
    if (depleted) {
      depletionMonth = m;
      break;
    }
    if (input.annualSpending <= 0 && m >= 12) {
      // Nothing is withdrawn, so the balance never depletes; stop after one illustrative year.
      break;
    }
  }

  return {
    nestEgg: num(nestEgg),
    nestEggReal: num(nestEgg.div(deflator(input.inflation, yearsToRetirement))),
    fireNumber,
    fireNumberAtRetirement: num(
      new D(fireNumber).times(deflator(input.inflation, yearsToRetirement)),
    ),
    fireAge,
    onTrack: fireAge !== null && fireAge <= input.retirementAge,
    depletionAge:
      depletionMonth === null
        ? null
        : Math.round((input.retirementAge + depletionMonth / 12) * 10) / 10,
    yearsLasting: depletionMonth === null ? null : Math.round((depletionMonth / 12) * 10) / 10,
    firstYearSpendingNominal: num(firstYearSpending),
    totalContributed: num(totalContributed),
    rows,
  };
}
