/** Starter budgets: a 50/30/20 template scaled to someone's income, and sample data to explore. */
import { D, num } from "@/lib/finance/decimal";
import { daysInMonth, monthKeyOf, pad2 } from "./dates";
import { monthlyAmount } from "./calc";
import {
  emptyBudget,
  newId,
  type BudgetCategory,
  type BudgetData,
  type BudgetGroup,
  type IncomeFrequency,
  type Transaction,
} from "./model";

interface StarterLine {
  name: string;
  group: BudgetGroup;
  /** Share of monthly take-home pay. */
  share: number;
  dueDay: number | null;
}

/** Shares add up to 50% needs, 30% wants, 20% savings. */
export const STARTER_LINES: StarterLine[] = [
  { name: "Rent or mortgage", group: "needs", share: 0.27, dueDay: 1 },
  { name: "Utilities", group: "needs", share: 0.04, dueDay: 15 },
  { name: "Phone & internet", group: "needs", share: 0.03, dueDay: 20 },
  { name: "Groceries", group: "needs", share: 0.09, dueDay: null },
  { name: "Transportation", group: "needs", share: 0.05, dueDay: null },
  { name: "Insurance", group: "needs", share: 0.02, dueDay: 5 },
  { name: "Eating out", group: "wants", share: 0.08, dueDay: null },
  { name: "Entertainment", group: "wants", share: 0.05, dueDay: null },
  { name: "Shopping", group: "wants", share: 0.08, dueDay: null },
  { name: "Subscriptions", group: "wants", share: 0.03, dueDay: 10 },
  { name: "Personal care", group: "wants", share: 0.03, dueDay: null },
  { name: "Gifts & other", group: "wants", share: 0.03, dueDay: null },
  { name: "Emergency fund", group: "savings", share: 0.1, dueDay: null },
  { name: "Retirement", group: "savings", share: 0.05, dueDay: null },
  { name: "Extra debt payments", group: "savings", share: 0.05, dueDay: null },
];

/** Rounds to the nearest $5 (friendlier starting numbers). */
function round5(n: number): number {
  return num(new D(n).div(5).toDecimalPlaces(0).times(5));
}

export function starterCategories(monthlyTakeHome: number): BudgetCategory[] {
  const cats = STARTER_LINES.map((l) => ({
    id: newId("cat"),
    name: l.name,
    group: l.group,
    planned: round5(monthlyTakeHome * l.share),
    dueDay: l.dueDay,
  }));
  // Rounding leaves a few dollars over or under; put the difference in the emergency fund so the
  // starter plan is balanced ("Left to budget: $0") from day one.
  const diff = new D(monthlyTakeHome).minus(cats.reduce((s, c) => s.plus(c.planned), new D(0)));
  const fund = cats.find((c) => c.name === "Emergency fund");
  if (fund) fund.planned = Math.max(0, num(diff.plus(fund.planned).toDecimalPlaces(2)));
  return cats;
}

export function starterBudget(payAmount: number, frequency: IncomeFrequency): BudgetData {
  const income = { id: newId("inc"), name: "Paycheck", amount: payAmount, frequency };
  return {
    ...emptyBudget(),
    setupDone: true,
    incomes: [income],
    categories: starterCategories(monthlyAmount(income)),
  };
}

/** A realistic example month (up to `today`) so people can explore before entering their own numbers. */
export function sampleBudget(today: string): BudgetData {
  const base = starterBudget(1_850, "biweekly");
  const key = monthKeyOf(today);
  const day = Math.min(Number(today.slice(8, 10)), daysInMonth(key));
  const byName = (n: string) => base.categories.find((c) => c.name === n)?.id ?? null;
  const entries: [number, string, number, string][] = [
    [1, "Rent or mortgage", 1_080, "Rent"],
    [2, "Groceries", 86.4, "Weekly groceries"],
    [3, "Eating out", 23.5, "Lunch with friends"],
    [5, "Insurance", 80, "Car insurance"],
    [6, "Transportation", 45, "Gas"],
    [8, "Groceries", 92.15, "Weekly groceries"],
    [9, "Entertainment", 32, "Movie night"],
    [10, "Subscriptions", 25.98, "Streaming + music"],
    [12, "Shopping", 64.99, "New shoes"],
    [14, "Emergency fund", 200, "Transfer to savings"],
    [15, "Utilities", 142.3, "Electric + water"],
    [16, "Groceries", 78.6, "Weekly groceries"],
    [18, "Eating out", 41.2, "Dinner out"],
    [20, "Phone & internet", 120, "Phone + internet"],
    [22, "Groceries", 88.05, "Weekly groceries"],
    [24, "Transportation", 48.5, "Gas"],
  ];
  const transactions: Transaction[] = entries
    .filter(([d]) => d <= day)
    .map(([d, cat, amt, note]) => ({
      id: newId("tx"),
      date: `${key}-${pad2(d)}`,
      type: "expense" as const,
      amount: amt,
      categoryId: byName(cat),
      note,
    }));
  for (const d of [7, 21]) {
    if (d <= day) {
      transactions.push({
        id: newId("tx"),
        date: `${key}-${pad2(d)}`,
        type: "income",
        amount: 1_850,
        categoryId: null,
        note: "Paycheck",
      });
    }
  }
  const paidSoFar = base.categories
    .filter((c) => c.dueDay !== null && c.dueDay <= day)
    .map((c) => c.id);
  return {
    ...base,
    isSample: true,
    paidBills: { [key]: paidSoFar },
    transactions,
    goals: [
      { id: newId("goal"), name: "Emergency fund", target: 6_000, saved: 1_200, monthly: 400 },
      { id: newId("goal"), name: "Summer trip", target: 1_500, saved: 350, monthly: 150 },
    ],
  };
}
