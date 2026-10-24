/** Budget Planner data model: types, validation schema and labels. Pure — no React, no browser APIs. */
import { z } from "zod";

export const BUDGET_GROUPS = ["needs", "wants", "savings"] as const;
export type BudgetGroup = (typeof BUDGET_GROUPS)[number];

export const GROUP_INFO: Record<
  BudgetGroup,
  { label: string; target: number; description: string; color: string }
> = {
  needs: {
    label: "Needs",
    target: 0.5,
    description:
      "Bills you must pay: housing, utilities, groceries, transportation, insurance, minimum debt payments.",
    color: "rgb(var(--chart-1))",
  },
  wants: {
    label: "Wants",
    target: 0.3,
    description: "Nice-to-haves: eating out, entertainment, shopping, subscriptions, hobbies.",
    color: "rgb(var(--chart-3))",
  },
  savings: {
    label: "Savings & debt",
    target: 0.2,
    description:
      "Your emergency fund, retirement, savings goals and paying off debt faster than the minimums.",
    color: "rgb(var(--chart-2))",
  },
};

export const INCOME_FREQUENCIES = {
  weekly: { label: "Every week", perMonth: 52 / 12 },
  biweekly: { label: "Every 2 weeks", perMonth: 26 / 12 },
  semimonthly: { label: "Twice a month", perMonth: 2 },
  monthly: { label: "Once a month", perMonth: 1 },
  yearly: { label: "Once a year", perMonth: 1 / 12 },
} as const;
export type IncomeFrequency = keyof typeof INCOME_FREQUENCIES;
const FREQUENCY_KEYS = Object.keys(INCOME_FREQUENCIES) as [IncomeFrequency, ...IncomeFrequency[]];

export const MAX_AMOUNT = 1_000_000_000;

const id = z.string().min(1).max(64);
const amount = z.number().finite().min(0).max(MAX_AMOUNT);
const name = z.string().max(60);
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const incomeSchema = z.object({ id, name, amount, frequency: z.enum(FREQUENCY_KEYS) });
export const categorySchema = z.object({
  id,
  name,
  group: z.enum(BUDGET_GROUPS),
  /** Planned amount per month. */
  planned: amount,
  /** Day of the month a bill is due, or null if this isn't a bill. */
  dueDay: z.number().int().min(1).max(31).nullable(),
});
export const goalSchema = z.object({ id, name, target: amount, saved: amount, monthly: amount });
export const transactionSchema = z.object({
  id,
  date: isoDateSchema,
  type: z.enum(["expense", "income"]),
  amount,
  categoryId: z.string().max(64).nullable(),
  note: z.string().max(140),
});

export const budgetSchema = z.object({
  version: z.literal(1),
  setupDone: z.boolean(),
  isSample: z.boolean(),
  incomes: z.array(incomeSchema).max(50),
  categories: z.array(categorySchema).max(100),
  transactions: z.array(transactionSchema).max(50_000),
  goals: z.array(goalSchema).max(50),
  /** monthKey ("YYYY-MM") → ids of bill categories marked paid that month. */
  paidBills: z.record(z.string().regex(/^\d{4}-\d{2}$/), z.array(z.string().max(64))),
});

export type IncomeSource = z.infer<typeof incomeSchema>;
export type BudgetCategory = z.infer<typeof categorySchema>;
export type SavingsGoal = z.infer<typeof goalSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type BudgetData = z.infer<typeof budgetSchema>;

export function emptyBudget(): BudgetData {
  return {
    version: 1,
    setupDone: false,
    isSample: false,
    incomes: [],
    categories: [],
    transactions: [],
    goals: [],
    paidBills: {},
  };
}

let counter = 0;
/** Short unique id (crypto when available). */
export function newId(prefix = "x"): string {
  const c = typeof globalThis.crypto !== "undefined" ? globalThis.crypto : undefined;
  if (c && "randomUUID" in c) return `${prefix}_${c.randomUUID().slice(0, 12)}`;
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Parses untrusted JSON (a restored backup or stored data) into valid budget data. */
export function parseBudget(
  raw: unknown,
): { ok: true; data: BudgetData } | { ok: false; error: string } {
  const result = budgetSchema.safeParse(raw);
  if (!result.success) return { ok: false, error: "This file isn't a valid budget backup." };
  return { ok: true, data: result.data };
}
