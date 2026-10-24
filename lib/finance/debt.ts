import { D, ZERO, cents, num, type Dec } from "./decimal";

export type DebtStrategy = "avalanche" | "snowball" | "custom";

export interface Debt {
  id: string;
  name: string;
  balance: number;
  /** APR as a decimal. */
  apr: number;
  minPayment: number;
}

export interface DebtPayoffInput {
  debts: Debt[];
  /** Total monthly amount available for all debts. */
  monthlyBudget: number;
  strategy: DebtStrategy;
}

export interface DebtSummary {
  id: string;
  name: string;
  /** Month number (1-based) the debt reaches $0, or null if never within the cap. */
  payoffMonth: number | null;
  interestPaid: number;
  /** True when the minimum payment alone doesn't cover the first month's interest. */
  minimumBelowInterest: boolean;
}

export interface DebtMonthRow {
  month: number;
  totalBalance: number;
  interest: number;
  paid: number;
  balances: Record<string, number>;
}

export type DebtStatus = "ok" | "insufficient-budget" | "never" | "empty";

export interface DebtPayoffResult {
  status: DebtStatus;
  /** Human-readable warnings for the UI. */
  warnings: string[];
  months: number | null;
  totalInterest: number;
  totalPaid: number;
  debts: DebtSummary[];
  timeline: DebtMonthRow[];
  order: string[];
}

export const MAX_MONTHS = 1200;

/** Order in which surplus money is aimed at debts. */
export function priorityOrder(debts: Debt[], strategy: DebtStrategy): Debt[] {
  const copy = [...debts];
  if (strategy === "avalanche") {
    copy.sort((a, b) => b.apr - a.apr || a.balance - b.balance);
  } else if (strategy === "snowball") {
    copy.sort((a, b) => a.balance - b.balance || b.apr - a.apr);
  }
  return copy;
}

function monthlyInterest(balance: Dec, apr: number): Dec {
  return cents(balance.times(apr).div(12));
}

export function simulateDebtPayoff(input: DebtPayoffInput): DebtPayoffResult {
  const active = input.debts.filter((d) => d.balance > 0);
  const ordered = priorityOrder(active, input.strategy);
  const order = ordered.map((d) => d.id);
  const empty: DebtPayoffResult = {
    status: "empty",
    warnings: [],
    months: 0,
    totalInterest: 0,
    totalPaid: 0,
    debts: [],
    timeline: [],
    order,
  };
  if (ordered.length === 0) return empty;

  const budget = cents(input.monthlyBudget);
  const warnings: string[] = [];
  const summaries: DebtSummary[] = ordered.map((d) => {
    const firstInterest = monthlyInterest(new D(d.balance), d.apr);
    const minimumBelowInterest = new D(d.minPayment).lte(firstInterest);
    if (minimumBelowInterest) {
      warnings.push(
        `${d.name || "This debt"}: the minimum payment ($${d.minPayment.toFixed(2)}) doesn't cover the monthly interest ($${firstInterest.toFixed(2)}). On its minimum alone, this debt will never be paid off.`,
      );
    }
    return { id: d.id, name: d.name, payoffMonth: null, interestPaid: 0, minimumBelowInterest };
  });

  const sumMinimums = ordered.reduce((s, d) => s.plus(d.minPayment), ZERO);
  if (budget.lt(sumMinimums)) {
    return {
      ...empty,
      status: "insufficient-budget",
      months: null,
      debts: summaries,
      warnings: [
        `Your monthly budget ($${budget.toFixed(2)}) is less than the total of your minimum payments ($${sumMinimums.toFixed(2)}). Raise the budget to at least the minimums — otherwise these debts will never be paid off.`,
        ...warnings,
      ],
    };
  }

  const totalFirstInterest = ordered.reduce((s, d) => s.plus(monthlyInterest(new D(d.balance), d.apr)), ZERO);
  if (budget.lte(totalFirstInterest)) {
    return {
      ...empty,
      status: "never",
      months: null,
      debts: summaries,
      warnings: [
        `Your payment ($${budget.toFixed(2)}/mo) is no more than the monthly interest ($${totalFirstInterest.toFixed(2)}). The balance will never go down, so this debt will never be paid off.`,
        ...(ordered.length > 1 ? warnings : []),
      ],
    };
  }

  const balances = new Map<string, Dec>(ordered.map((d) => [d.id, new D(d.balance)]));
  const interestPaid = new Map<string, Dec>(ordered.map((d) => [d.id, ZERO]));
  const timeline: DebtMonthRow[] = [];
  let totalInterest: Dec = ZERO;
  let totalPaid: Dec = ZERO;
  let month = 0;

  const remaining = () => ordered.some((d) => (balances.get(d.id) ?? ZERO).gt(0));

  while (remaining() && month < MAX_MONTHS) {
    month += 1;
    let monthInterest: Dec = ZERO;
    let monthPaid: Dec = ZERO;

    // 1. Accrue interest.
    for (const d of ordered) {
      const bal = balances.get(d.id) ?? ZERO;
      if (bal.lte(0)) continue;
      const interest = monthlyInterest(bal, d.apr);
      balances.set(d.id, bal.plus(interest));
      interestPaid.set(d.id, (interestPaid.get(d.id) ?? ZERO).plus(interest));
      monthInterest = monthInterest.plus(interest);
    }

    // 2. Pay minimums on every open debt.
    let available = budget;
    for (const d of ordered) {
      const bal = balances.get(d.id) ?? ZERO;
      if (bal.lte(0)) continue;
      const pay = D.min(bal, d.minPayment, available);
      balances.set(d.id, bal.minus(pay));
      available = available.minus(pay);
      monthPaid = monthPaid.plus(pay);
    }

    // 3. Everything left (including minimums freed by paid-off debts) goes to targets in order.
    for (const d of ordered) {
      if (available.lte(0)) break;
      const bal = balances.get(d.id) ?? ZERO;
      if (bal.lte(0)) continue;
      const pay = D.min(bal, available);
      balances.set(d.id, bal.minus(pay));
      available = available.minus(pay);
      monthPaid = monthPaid.plus(pay);
    }

    const snapshot: Record<string, number> = {};
    let total: Dec = ZERO;
    for (const d of ordered) {
      const bal = balances.get(d.id) ?? ZERO;
      snapshot[d.id] = num(bal);
      total = total.plus(bal);
      const summary = summaries.find((s) => s.id === d.id);
      if (summary && summary.payoffMonth === null && bal.lte(0)) summary.payoffMonth = month;
    }
    totalInterest = totalInterest.plus(monthInterest);
    totalPaid = totalPaid.plus(monthPaid);
    timeline.push({
      month,
      totalBalance: num(total),
      interest: num(monthInterest),
      paid: num(monthPaid),
      balances: snapshot,
    });
  }

  for (const s of summaries) s.interestPaid = num(interestPaid.get(s.id) ?? ZERO);
  const finished = !remaining();
  return {
    status: finished ? "ok" : "never",
    warnings: finished
      ? warnings
      : [`Even after ${MAX_MONTHS / 12} years these debts aren't paid off. Increase your monthly budget.`, ...warnings],
    months: finished ? month : null,
    totalInterest: num(totalInterest),
    totalPaid: num(totalPaid),
    debts: summaries,
    timeline,
    order,
  };
}

export interface StrategyComparison {
  avalanche: DebtPayoffResult;
  snowball: DebtPayoffResult;
  interestDifference: number;
  monthsDifference: number | null;
}

export function compareStrategies(debts: Debt[], monthlyBudget: number): StrategyComparison {
  const avalanche = simulateDebtPayoff({ debts, monthlyBudget, strategy: "avalanche" });
  const snowball = simulateDebtPayoff({ debts, monthlyBudget, strategy: "snowball" });
  return {
    avalanche,
    snowball,
    interestDifference: num(new D(snowball.totalInterest).minus(avalanche.totalInterest)),
    monthsDifference:
      avalanche.months !== null && snowball.months !== null ? snowball.months - avalanche.months : null,
  };
}
