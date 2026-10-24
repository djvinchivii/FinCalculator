import { describe, expect, it } from "vitest";
import {
  billsForMonth,
  budgetInsights,
  categoryState,
  monthlyAmount,
  monthlyIncome,
  projectGoal,
  summarizeMonth,
} from "@/lib/budget/calc";
import { daysInMonth, dueDateIn, monthLabel, shiftMonth } from "@/lib/budget/dates";
import { emptyBudget, parseBudget, type BudgetData } from "@/lib/budget/model";
import { budgetReducer } from "@/lib/budget/reducer";
import { STARTER_LINES, sampleBudget, starterBudget } from "@/lib/budget/templates";

function fixture(): BudgetData {
  return {
    ...emptyBudget(),
    setupDone: true,
    incomes: [{ id: "i1", name: "Pay", amount: 4000, frequency: "monthly" }],
    categories: [
      { id: "rent", name: "Rent", group: "needs", planned: 1500, dueDay: 1 },
      { id: "food", name: "Groceries", group: "needs", planned: 400, dueDay: null },
      { id: "fun", name: "Fun", group: "wants", planned: 200, dueDay: null },
      { id: "save", name: "Savings", group: "savings", planned: 500, dueDay: null },
    ],
    transactions: [
      { id: "t1", date: "2026-10-01", type: "expense", amount: 1500, categoryId: "rent", note: "" },
      {
        id: "t2",
        date: "2026-10-03",
        type: "expense",
        amount: 120.1,
        categoryId: "food",
        note: "",
      },
      { id: "t3", date: "2026-10-04", type: "expense", amount: 0.2, categoryId: "food", note: "" },
      { id: "t4", date: "2026-10-05", type: "expense", amount: 250, categoryId: "fun", note: "" },
      { id: "t5", date: "2026-10-06", type: "expense", amount: 30, categoryId: null, note: "" },
      { id: "t6", date: "2026-10-07", type: "income", amount: 4000, categoryId: null, note: "" },
      {
        id: "t7",
        date: "2026-09-28",
        type: "expense",
        amount: 999,
        categoryId: "fun",
        note: "last month",
      },
    ],
  };
}

describe("income", () => {
  it("converts pay schedules to monthly amounts", () => {
    expect(monthlyAmount({ amount: 1200, frequency: "biweekly" })).toBe(2600);
    expect(monthlyAmount({ amount: 1000, frequency: "weekly" })).toBeCloseTo(4333.33, 2);
    expect(monthlyAmount({ amount: 1500, frequency: "semimonthly" })).toBe(3000);
    expect(monthlyAmount({ amount: 60000, frequency: "yearly" })).toBe(5000);
    expect(monthlyIncome(fixture().incomes)).toBe(4000);
  });
});

describe("month summary", () => {
  const s = summarizeMonth(fixture(), "2026-10", "2026-10-10");
  it("totals planned, spent and what's left (only this month's transactions)", () => {
    expect(s.plannedIncome).toBe(4000);
    expect(s.planned).toBe(2600);
    expect(s.spent).toBe(1900.3); // no float drift from 120.1 + 0.2
    expect(s.receivedIncome).toBe(4000);
    expect(s.leftToBudget).toBe(1400);
    expect(s.leftToSpend).toBeCloseTo(699.7, 10);
    expect(s.uncategorizedSpent).toBe(30);
  });
  it("flags category states", () => {
    const by = Object.fromEntries(s.categories.map((c) => [c.category.id, c]));
    expect(by.rent?.state).toBe("ok"); // a bill paid in full
    expect(categoryState(400, 380)).toBe("near");
    expect(by.food?.state).toBe("ok");
    expect(by.fun?.state).toBe("over");
    expect(by.fun?.remaining).toBe(-50);
    expect(categoryState(0, 10)).toBe("unplanned");
    expect(categoryState(0, 0)).toBe("idle");
  });
  it("groups against 50/30/20", () => {
    const needs = s.groups.find((g) => g.group === "needs");
    expect(needs?.planned).toBe(1900);
    expect(needs?.shareOfIncome).toBeCloseTo(0.475, 6);
    expect(needs?.target).toBe(0.5);
  });
  it("safe to spend per day uses flexible needs + wants only", () => {
    // Oct has 31 days; on the 10th, 22 days are left. Flexible left: groceries 279.70 + fun 0.
    expect(s.daysLeft).toBe(22);
    expect(s.safePerDay).toBeCloseTo(279.7 / 22, 2);
    expect(summarizeMonth(fixture(), "2026-09", "2026-10-10").safePerDay).toBeNull();
  });
});

describe("bills", () => {
  it("marks bills paid by checkbox or by payments covering the plan", () => {
    const data = fixture();
    data.categories.push({ id: "phone", name: "Phone", group: "needs", planned: 60, dueDay: 12 });
    data.categories.push({ id: "ins", name: "Insurance", group: "needs", planned: 90, dueDay: 31 });
    data.categories.push({ id: "gym", name: "Gym", group: "wants", planned: 30, dueDay: 5 });
    let bills = billsForMonth(data, "2026-10", "2026-10-10");
    const state = Object.fromEntries(bills.map((b) => [b.category.id, b.state]));
    expect(state).toEqual({ rent: "paid", gym: "overdue", phone: "due-soon", ins: "upcoming" });
    data.paidBills = { "2026-10": ["gym"] };
    bills = billsForMonth(data, "2026-10", "2026-10-10");
    expect(bills.find((b) => b.category.id === "gym")?.paid).toBe(true);
    expect(dueDateIn("2026-02", 31)).toBe("2026-02-28");
  });
});

describe("goals", () => {
  it("projects months to go", () => {
    expect(projectGoal({ id: "g", name: "", target: 1000, saved: 250, monthly: 100 })).toEqual({
      progress: 0.25,
      remaining: 750,
      monthsToGo: 8,
    });
    expect(
      projectGoal({ id: "g", name: "", target: 1000, saved: 1000, monthly: 0 }).monthsToGo,
    ).toBe(0);
    expect(
      projectGoal({ id: "g", name: "", target: 1000, saved: 0, monthly: 0 }).monthsToGo,
    ).toBeNull();
  });
});

describe("insights", () => {
  it("warns about overspending, over-planned budgets and unassigned money", () => {
    const data = fixture();
    const s = summarizeMonth(data, "2026-10", "2026-10-10");
    const text = budgetInsights(data, s, billsForMonth(data, "2026-10", "2026-10-10"))
      .map((i) => i.text)
      .join(" | ");
    expect(text).toMatch(/Fun is \$50 over budget/);
    expect(text).toMatch(/\$1,400 of your income doesn't have a job yet/);
    expect(text).toMatch(/\$30 of spending has no category/);
    data.categories[0]!.planned = 5000;
    const s2 = summarizeMonth(data, "2026-10", "2026-10-10");
    expect(budgetInsights(data, s2, [])[0]?.tone).toBe("danger");
  });
  it("asks for income first", () => {
    const d = emptyBudget();
    expect(budgetInsights(d, summarizeMonth(d, "2026-10", "2026-10-10"), [])[0]?.text).toMatch(
      /Add your income/,
    );
  });
});

describe("templates", () => {
  it("starter shares add up to 50/30/20", () => {
    const by = (g: string) =>
      STARTER_LINES.filter((l) => l.group === g).reduce((a, l) => a + l.share, 0);
    expect(by("needs")).toBeCloseTo(0.5, 10);
    expect(by("wants")).toBeCloseTo(0.3, 10);
    expect(by("savings")).toBeCloseTo(0.2, 10);
    const b = starterBudget(4000, "monthly");
    expect(b.setupDone).toBe(true);
    expect(
      b.categories.filter((c) => c.name !== "Emergency fund").every((c) => c.planned % 5 === 0),
    ).toBe(true);
    // Starts balanced: every dollar has a job.
    const odd = starterBudget(1850, "biweekly");
    expect(summarizeMonth(odd, "2026-10", "2026-10-10").leftToBudget).toBe(0);
    expect(parseBudget(JSON.parse(JSON.stringify(b))).ok).toBe(true);
  });
  it("sample data only includes days up to today and is valid", () => {
    const s = sampleBudget("2026-10-09");
    expect(s.isSample).toBe(true);
    expect(s.transactions.every((t) => t.date <= "2026-10-09")).toBe(true);
    expect(s.transactions.length).toBeGreaterThan(5);
    expect(parseBudget(JSON.parse(JSON.stringify(s))).ok).toBe(true);
  });
});

describe("reducer", () => {
  it("removing a category keeps its transactions as uncategorized", () => {
    const next = budgetReducer(
      { ...fixture(), paidBills: { "2026-10": ["rent"] } },
      { type: "removeCategory", id: "rent" },
    );
    expect(next.categories.some((c) => c.id === "rent")).toBe(false);
    expect(next.transactions.find((t) => t.id === "t1")?.categoryId).toBeNull();
    expect(next.paidBills["2026-10"]).toEqual([]);
  });
  it("adds, edits and removes transactions; income has no category", () => {
    let d = budgetReducer(fixture(), {
      type: "saveTransaction",
      tx: {
        id: "n1",
        date: "2026-10-11",
        type: "income",
        amount: 50,
        categoryId: "fun",
        note: "gift",
      },
    });
    expect(d.transactions.find((t) => t.id === "n1")?.categoryId).toBeNull();
    d = budgetReducer(d, {
      type: "saveTransaction",
      tx: {
        id: "n1",
        date: "2026-10-11",
        type: "income",
        amount: 75,
        categoryId: null,
        note: "gift",
      },
    });
    expect(d.transactions.filter((t) => t.id === "n1")).toHaveLength(1);
    expect(d.transactions.find((t) => t.id === "n1")?.amount).toBe(75);
    d = budgetReducer(d, { type: "removeTransaction", id: "n1" });
    expect(d.transactions.some((t) => t.id === "n1")).toBe(false);
  });
  it("toggles bills and contributes to goals", () => {
    let d = budgetReducer(fixture(), {
      type: "toggleBillPaid",
      monthKey: "2026-10",
      categoryId: "rent",
    });
    expect(d.paidBills["2026-10"]).toEqual(["rent"]);
    d = budgetReducer(d, { type: "toggleBillPaid", monthKey: "2026-10", categoryId: "rent" });
    expect(d.paidBills["2026-10"]).toEqual([]);
    d = budgetReducer(d, { type: "addGoal", goal: { name: "Trip", target: 500 } });
    const id = d.goals[0]!.id;
    d = budgetReducer(d, { type: "contributeGoal", id, amount: 0.1 });
    d = budgetReducer(d, { type: "contributeGoal", id, amount: 0.2 });
    expect(d.goals[0]?.saved).toBe(0.3);
  });
});

describe("dates", () => {
  it("shifts months across years", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(daysInMonth("2028-02")).toBe(29);
    expect(monthLabel("2026-10")).toBe("October 2026");
  });
});

describe("validation", () => {
  it("rejects malformed backups", () => {
    expect(parseBudget({ version: 2 }).ok).toBe(false);
    expect(
      parseBudget({
        ...emptyBudget(),
        transactions: [
          { id: "x", date: "bad", type: "expense", amount: -5, categoryId: null, note: "" },
        ],
      }).ok,
    ).toBe(false);
    expect(parseBudget(emptyBudget()).ok).toBe(true);
  });
});
