/** Budget Planner calculations. Pure functions; money sums use Decimal to avoid float drift. */
import { D, num } from "@/lib/finance/decimal";
import { daysBetween, daysInMonth, dueDateIn, monthKeyOf } from "./dates";
import {
  BUDGET_GROUPS,
  GROUP_INFO,
  INCOME_FREQUENCIES,
  type BudgetCategory,
  type BudgetData,
  type BudgetGroup,
  type IncomeSource,
  type SavingsGoal,
  type Transaction,
} from "./model";

export function sum(values: number[]): number {
  return num(values.reduce((acc, v) => acc.plus(v), new D(0)));
}

export function monthlyAmount(income: Pick<IncomeSource, "amount" | "frequency">): number {
  return num(
    new D(income.amount).times(INCOME_FREQUENCIES[income.frequency].perMonth).toDecimalPlaces(2),
  );
}

export function monthlyIncome(incomes: IncomeSource[]): number {
  return sum(incomes.map(monthlyAmount));
}

export function transactionsInMonth(transactions: Transaction[], key: string): Transaction[] {
  return transactions.filter((t) => monthKeyOf(t.date) === key);
}

export type CategoryState = "ok" | "near" | "over" | "unplanned" | "idle";

export interface CategoryStatus {
  category: BudgetCategory;
  spent: number;
  remaining: number;
  /** Share of the plan used (0–∞), or null when nothing is planned. */
  used: number | null;
  state: CategoryState;
}

export interface GroupSummary {
  group: BudgetGroup;
  planned: number;
  spent: number;
  /** Planned amount as a share of monthly income, or null with no income. */
  shareOfIncome: number | null;
  target: number;
}

export interface MonthSummary {
  key: string;
  plannedIncome: number;
  receivedIncome: number;
  planned: number;
  spent: number;
  /** Income not yet given a job in the plan (negative = plan spends more than you earn). */
  leftToBudget: number;
  /** Planned spending minus actual spending (negative = over budget). */
  leftToSpend: number;
  uncategorizedSpent: number;
  categories: CategoryStatus[];
  groups: GroupSummary[];
  isCurrentMonth: boolean;
  daysLeft: number | null;
  /** Flexible (non-bill) money left per remaining day this month, or null. */
  safePerDay: number | null;
}

export function categoryState(planned: number, spent: number): CategoryState {
  if (planned <= 0) return spent > 0 ? "unplanned" : "idle";
  if (spent > planned + 0.004) return "over";
  if (spent >= planned * 0.9) return "near";
  return "ok";
}

export function summarizeMonth(data: BudgetData, key: string, today: string): MonthSummary {
  const tx = transactionsInMonth(data.transactions, key);
  const expenses = tx.filter((t) => t.type === "expense");
  const spentBy = new Map<string, number>();
  for (const t of expenses) {
    const k = t.categoryId ?? "";
    spentBy.set(k, sum([spentBy.get(k) ?? 0, t.amount]));
  }
  const knownIds = new Set(data.categories.map((c) => c.id));
  const uncategorizedSpent = sum(
    expenses
      .filter((t) => t.categoryId === null || !knownIds.has(t.categoryId))
      .map((t) => t.amount),
  );

  const categories: CategoryStatus[] = data.categories.map((category) => {
    const spent = spentBy.get(category.id) ?? 0;
    return {
      category,
      spent,
      remaining: num(new D(category.planned).minus(spent)),
      used: category.planned > 0 ? spent / category.planned : null,
      // A bill paid in full is simply done, not "nearly over budget".
      state:
        category.dueDay !== null && categoryState(category.planned, spent) === "near"
          ? "ok"
          : categoryState(category.planned, spent),
    };
  });

  const plannedIncome = monthlyIncome(data.incomes);
  const planned = sum(data.categories.map((c) => c.planned));
  const spent = sum(expenses.map((t) => t.amount));
  const groups: GroupSummary[] = BUDGET_GROUPS.map((group) => {
    const inGroup = categories.filter((c) => c.category.group === group);
    const gPlanned = sum(inGroup.map((c) => c.category.planned));
    return {
      group,
      planned: gPlanned,
      spent: sum(inGroup.map((c) => c.spent)),
      shareOfIncome: plannedIncome > 0 ? gPlanned / plannedIncome : null,
      target: GROUP_INFO[group].target,
    };
  });

  const isCurrentMonth = monthKeyOf(today) === key;
  const daysLeft = isCurrentMonth ? daysInMonth(key) - Number(today.slice(8, 10)) + 1 : null;
  const flexibleLeft = sum(
    categories
      .filter((c) => c.category.dueDay === null && c.category.group !== "savings")
      .map((c) => Math.max(0, c.remaining)),
  );
  const safePerDay =
    daysLeft !== null && daysLeft > 0 && planned > 0
      ? num(new D(flexibleLeft).div(daysLeft).toDecimalPlaces(2))
      : null;

  return {
    key,
    plannedIncome,
    receivedIncome: sum(tx.filter((t) => t.type === "income").map((t) => t.amount)),
    planned,
    spent,
    leftToBudget: num(new D(plannedIncome).minus(planned)),
    leftToSpend: num(new D(planned).minus(spent)),
    uncategorizedSpent,
    categories,
    groups,
    isCurrentMonth,
    daysLeft,
    safePerDay,
  };
}

export type BillState = "paid" | "overdue" | "due-soon" | "upcoming";

export interface BillStatus {
  category: BudgetCategory;
  dueDate: string;
  amount: number;
  spent: number;
  paid: boolean;
  /** True when it counts as paid because payments logged this month cover the planned amount. */
  paidByTransactions: boolean;
  state: BillState;
  /** Days from today until the due date (negative = past due). */
  daysUntil: number;
}

export function billsForMonth(data: BudgetData, key: string, today: string): BillStatus[] {
  const marked = new Set(data.paidBills[key] ?? []);
  const summary = summarizeMonth(data, key, today);
  return summary.categories
    .filter((c) => c.category.dueDay !== null)
    .map((c) => {
      const dueDate = dueDateIn(key, c.category.dueDay ?? 1);
      const paidByTransactions = c.category.planned > 0 && c.spent >= c.category.planned - 0.004;
      const paid = marked.has(c.category.id) || paidByTransactions;
      const daysUntil = daysBetween(today, dueDate);
      const state: BillState = paid
        ? "paid"
        : daysUntil < 0
          ? "overdue"
          : daysUntil <= 3
            ? "due-soon"
            : "upcoming";
      return {
        category: c.category,
        dueDate,
        amount: c.category.planned,
        spent: c.spent,
        paid,
        paidByTransactions,
        state,
        daysUntil,
      };
    })
    .sort(
      (a, b) =>
        a.dueDate.localeCompare(b.dueDate) || a.category.name.localeCompare(b.category.name),
    );
}

export interface GoalProjection {
  progress: number;
  remaining: number;
  /** Months until the target at the current monthly amount; 0 if reached; null if never. */
  monthsToGo: number | null;
}

export function projectGoal(goal: SavingsGoal): GoalProjection {
  const remaining = Math.max(0, num(new D(goal.target).minus(goal.saved)));
  const progress = goal.target > 0 ? Math.min(1, goal.saved / goal.target) : goal.saved > 0 ? 1 : 0;
  let monthsToGo: number | null;
  if (remaining === 0) monthsToGo = 0;
  else if (goal.monthly <= 0) monthsToGo = null;
  else monthsToGo = new D(remaining).div(goal.monthly).ceil().toNumber();
  return { progress, remaining, monthsToGo };
}

export type InsightTone = "good" | "info" | "warning" | "danger";
export interface Insight {
  tone: InsightTone;
  text: string;
}

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));

/** Plain-English tips, most important first. */
export function budgetInsights(data: BudgetData, s: MonthSummary, bills: BillStatus[]): Insight[] {
  const out: Insight[] = [];
  if (s.plannedIncome <= 0) {
    out.push({
      tone: "info",
      text: "Add your income in the Plan tab so we can tell you how much you have to work with.",
    });
    return out;
  }
  if (s.leftToBudget < -0.5) {
    out.push({
      tone: "danger",
      text: `Your plan spends ${usd(-s.leftToBudget)} more than you earn each month. Trim a few categories in the Plan tab until “Left to budget” reaches $0.`,
    });
  } else if (s.leftToBudget > 0.5) {
    out.push({
      tone: "info",
      text: `${usd(s.leftToBudget)} of your income doesn't have a job yet. Give every dollar a job — adding it to savings or a goal is a great choice.`,
    });
  }

  for (const b of bills.filter((x) => x.state === "overdue" && s.isCurrentMonth)) {
    out.push({
      tone: "danger",
      text: `${b.category.name} (${usd(b.amount)}) was due ${-b.daysUntil} day${b.daysUntil === -1 ? "" : "s"} ago and isn't marked paid.`,
    });
  }
  for (const b of bills.filter((x) => x.state === "due-soon")) {
    const when =
      b.daysUntil === 0 ? "today" : b.daysUntil === 1 ? "tomorrow" : `in ${b.daysUntil} days`;
    out.push({ tone: "warning", text: `${b.category.name} (${usd(b.amount)}) is due ${when}.` });
  }

  const over = s.categories
    .filter((c) => c.state === "over")
    .sort((a, b) => a.remaining - b.remaining);
  for (const c of over.slice(0, 3)) {
    out.push({
      tone: "danger",
      text: `${c.category.name} is ${usd(-c.remaining)} over budget this month.`,
    });
  }
  if (s.daysLeft !== null && s.daysLeft > 3) {
    for (const c of s.categories.filter((x) => x.state === "near").slice(0, 2)) {
      out.push({
        tone: "warning",
        text: `${c.category.name}: ${Math.round((c.used ?? 0) * 100)}% used with ${s.daysLeft} days left in the month.`,
      });
    }
  }
  if (s.uncategorizedSpent > 0) {
    out.push({
      tone: "info",
      text: `${usd(s.uncategorizedSpent)} of spending has no category. Give it one so your totals are accurate.`,
    });
  }

  const needs = s.groups.find((g) => g.group === "needs");
  const savings = s.groups.find((g) => g.group === "savings");
  if (needs?.shareOfIncome != null && needs.shareOfIncome > 0.6) {
    out.push({
      tone: "info",
      text: `Needs take up ${Math.round(needs.shareOfIncome * 100)}% of your income (the 50/30/20 guideline is about 50%). That's common when rent is high — look for one big cost you could lower over time.`,
    });
  }
  if (savings?.shareOfIncome != null && savings.shareOfIncome < 0.1) {
    out.push({
      tone: "info",
      text: `You're planning to save ${Math.round(savings.shareOfIncome * 100)}% of your income. Even a small automatic transfer each payday helps — aim to work up toward 20%.`,
    });
  }
  if (data.goals.length === 0) {
    out.push({
      tone: "info",
      text: "Tip: set up an emergency fund goal in the Goals tab — 3 to 6 months of needs is a common target.",
    });
  }
  if (out.length === 0 || out.every((i) => i.tone === "info" || i.tone === "good")) {
    if (s.spent > 0 && s.leftToSpend >= 0 && over.length === 0) {
      out.unshift({
        tone: "good",
        text: "Nice work — every category is within budget so far this month.",
      });
    }
  }
  return out;
}
