import { D, cents, num } from "./decimal";

export interface BudgetSplitInput {
  monthlyIncome: number;
  /** Percentages as decimals; must total 1. */
  needs: number;
  wants: number;
  savings: number;
}

export interface BudgetSplitResult {
  needs: number;
  wants: number;
  savings: number;
  valid: boolean;
}

export function budgetSplit(input: BudgetSplitInput): BudgetSplitResult {
  const total = new D(input.needs).plus(input.wants).plus(input.savings);
  const income = new D(input.monthlyIncome);
  return {
    needs: num(cents(income.times(input.needs))),
    wants: num(cents(income.times(input.wants))),
    savings: num(cents(income.times(input.savings))),
    valid: total.minus(1).abs().lt(1e-9),
  };
}

export interface EmergencyFundInput {
  monthlyExpenses: number;
  months: number;
  currentSavings: number;
  monthlySaving: number;
}

export interface EmergencyFundResult {
  target: number;
  remaining: number;
  /** Whole months to reach the target, 0 if already funded, null if never (saving ≤ 0). */
  monthsToGoal: number | null;
}

export function emergencyFund(input: EmergencyFundInput): EmergencyFundResult {
  const target = new D(input.monthlyExpenses).times(input.months);
  const remaining = D.max(0, target.minus(input.currentSavings));
  let monthsToGoal: number | null;
  if (remaining.isZero()) monthsToGoal = 0;
  else if (input.monthlySaving <= 0) monthsToGoal = null;
  else monthsToGoal = remaining.div(input.monthlySaving).ceil().toNumber();
  return { target: num(cents(target)), remaining: num(cents(remaining)), monthsToGoal };
}
