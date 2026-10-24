import { describe, expect, it } from "vitest";
import {
  amortize,
  budgetSplit,
  cagrSeries,
  emergencyFund,
  mortgage,
  projectRetirement,
  purchasingPower,
  simpleInterest,
  simulateCompound,
  simulateDebtPayoff,
  compareStrategies,
  addMonths,
  paymentDate,
} from "@/lib/finance";

describe("compound", () => {
  it("annuity due is (1+i) × ordinary annuity", () => {
    const common = { principal: 0, contribution: 100, contributionFrequency: 12 as const, annualRate: 0.06, compounding: 12 as const, years: 5 };
    const end = simulateCompound({ ...common, timing: "end" }).futureBalance;
    const begin = simulateCompound({ ...common, timing: "begin" }).futureBalance;
    expect(begin).toBeCloseTo(end * 1.005, 6);
  });
  it("produces one row per year and an inflation-adjusted balance", () => {
    const r = simulateCompound({ principal: 1000, contribution: 0, contributionFrequency: 12, timing: "end", annualRate: 0.05, compounding: 1, years: 3, inflation: 0.02 });
    expect(r.years.map((y) => y.year)).toEqual([1, 2, 3]);
    expect(r.futureBalance).toBeCloseTo(1157.625, 6);
    expect(r.realBalance).toBeCloseTo(1157.625 / 1.02 ** 3, 6);
  });
  it("contribution growth raises contributions each year", () => {
    const r = simulateCompound({ principal: 0, contribution: 100, contributionFrequency: 12, timing: "end", annualRate: 0, compounding: 12, years: 2, contributionGrowth: 0.1 });
    expect(r.years[0]?.contributions).toBeCloseTo(1200, 8);
    expect(r.years[1]?.contributions).toBeCloseTo(1320, 8);
  });
  it("handles zero years", () => {
    const r = simulateCompound({ principal: 500, contribution: 50, contributionFrequency: 12, timing: "end", annualRate: 0.05, compounding: 12, years: 0 });
    expect(r.futureBalance).toBe(500);
    expect(r.years).toHaveLength(0);
  });
});

describe("simple interest", () => {
  it("uses the day-count basis", () => {
    expect(simpleInterest({ principal: 36_000, rate: 0.1, time: 90, unit: "days", basis: 360 }).interest).toBeCloseTo(900, 8);
    expect(simpleInterest({ principal: 36_500, rate: 0.1, time: 90, unit: "days", basis: 365 }).interest).toBeCloseTo(900, 8);
    expect(simpleInterest({ principal: 1000, rate: 0.12, time: 6, unit: "months", basis: 365 }).interest).toBeCloseTo(60, 8);
  });
});

describe("loan extras", () => {
  const base = { principal: 200_000, annualRate: 0.06, termMonths: 360, paymentsPerYear: 12 as const, startDate: "2025-01-01" };
  it("extra monthly payments save interest and time", () => {
    const r = amortize({ ...base, extras: { perPayment: 200 } });
    expect(r.interestSaved).toBeGreaterThan(50_000);
    expect(r.paymentsSaved).toBeGreaterThan(60);
    expect(r.rows.at(-1)?.balance).toBe(0);
  });
  it("one-time extra applies on the chosen date", () => {
    const r = amortize({ ...base, extras: { oneTime: 10_000, oneTimeDate: "2026-06-15" } });
    const row = r.rows.find((x) => x.extra > 0);
    expect(row?.date).toBe("2026-07-01");
    expect(row?.extra).toBe(10_000);
  });
  it("yearly extra applies every 12th payment", () => {
    const r = amortize({ ...base, extras: { yearly: 1000 } });
    expect(r.rows.filter((x) => x.extra > 0).slice(0, 2).map((x) => x.period)).toEqual([12, 24]);
  });
  it("first payment is one period after the start date", () => {
    const r = amortize(base);
    expect(r.rows[0]?.date).toBe("2025-02-01");
    expect(r.payoffDate).toBe("2055-01-01");
  });
});

describe("dates", () => {
  it("clamps month ends", () => {
    expect(addMonths(new Date(Date.UTC(2025, 0, 31)), 1).toISOString().slice(0, 10)).toBe("2025-02-28");
    expect(paymentDate(new Date(Date.UTC(2025, 0, 1)), 1, 26).toISOString().slice(0, 10)).toBe("2025-01-15");
  });
});

describe("mortgage", () => {
  const input = {
    homePrice: 400_000,
    downPayment: { mode: "percent" as const, value: 0.1 },
    annualRate: 0.065,
    termYears: 30,
    propertyTax: { mode: "percent" as const, value: 0.012 },
    insuranceAnnual: 1_500,
    hoaMonthly: 50,
    pmiRate: 0.005,
    startDate: "2025-01-01",
  };
  it("computes the monthly breakdown", () => {
    const m = mortgage(input);
    expect(m.loanAmount).toBe(360_000);
    expect(m.monthly.principalAndInterest).toBe(2_275.44);
    expect(m.monthly.tax).toBe(400);
    expect(m.monthly.insurance).toBe(125);
    expect(m.monthly.hoa).toBe(50);
    expect(m.monthly.pmi).toBe(150);
    expect(m.monthly.total).toBeCloseTo(3_000.44, 2);
  });
  it("drops PMI when the balance reaches 78% of the home value", () => {
    const m = mortgage(input);
    expect(m.pmiRequired).toBe(true);
    expect(m.pmiDropOffDate).not.toBeNull();
    const idx = m.rows.findIndex((r) => r.date === m.pmiDropOffDate);
    expect(m.rows[idx - 1]?.balance).toBeLessThanOrEqual(312_000);
    expect(m.rows[idx - 2]?.balance).toBeGreaterThan(312_000);
    expect(m.rows.slice(idx).every((r) => r.pmi === 0)).toBe(true);
    expect(m.totalPmi).toBeCloseTo(m.pmiMonths * 150, 2);
  });
  it("no PMI with 20% down", () => {
    const m = mortgage({ ...input, downPayment: { mode: "amount", value: 80_000 } });
    expect(m.pmiRequired).toBe(false);
    expect(m.totalPmi).toBe(0);
    expect(m.pmiDropOffDate).toBeNull();
  });
});

describe("debt payoff", () => {
  const debts = [
    { id: "a", name: "Card A", balance: 3_000, apr: 0.22, minPayment: 90 },
    { id: "b", name: "Card B", balance: 800, apr: 0.18, minPayment: 25 },
    { id: "c", name: "Car", balance: 9_000, apr: 0.06, minPayment: 220 },
  ];
  it("orders targets by strategy", () => {
    const c = compareStrategies(debts, 600);
    expect(c.avalanche.order).toEqual(["a", "b", "c"]);
    expect(c.snowball.order).toEqual(["b", "a", "c"]);
    expect(c.avalanche.status).toBe("ok");
    expect(c.avalanche.timeline.at(-1)?.totalBalance).toBe(0);
    expect(c.interestDifference).toBeGreaterThanOrEqual(0);
  });
  it("warns when the budget is below the minimums", () => {
    const r = simulateDebtPayoff({ debts, monthlyBudget: 100, strategy: "snowball" });
    expect(r.status).toBe("insufficient-budget");
    expect(r.warnings[0]).toMatch(/less than the total of your minimum payments/);
  });
  it("custom order keeps the given order", () => {
    const r = simulateDebtPayoff({ debts, monthlyBudget: 600, strategy: "custom" });
    expect(r.order).toEqual(["a", "b", "c"]);
  });
  it("handles empty input", () => {
    expect(simulateDebtPayoff({ debts: [], monthlyBudget: 100, strategy: "avalanche" }).status).toBe("empty");
  });
});

describe("retirement", () => {
  it("projects nest egg, FIRE number, and drawdown", () => {
    const r = projectRetirement({
      currentAge: 30,
      retirementAge: 60,
      currentSavings: 50_000,
      monthlyContribution: 1_000,
      preReturn: 0.07,
      postReturn: 0.05,
      inflation: 0.03,
      annualSpending: 40_000,
      withdrawalRate: 0.04,
    });
    expect(r.fireNumber).toBe(1_000_000);
    expect(r.nestEgg).toBeGreaterThan(1_500_000);
    expect(r.nestEggReal).toBeCloseTo(r.nestEgg / 1.03 ** 30, 4);
    expect(r.fireAge).not.toBeNull();
    expect(r.rows.some((x) => x.phase === "retired")).toBe(true);
  });
  it("detects running out of money", () => {
    const r = projectRetirement({
      currentAge: 60, retirementAge: 60, currentSavings: 100_000, monthlyContribution: 0,
      preReturn: 0, postReturn: 0, inflation: 0, annualSpending: 20_000, withdrawalRate: 0.04,
    });
    expect(r.depletionAge).toBe(65);
    expect(r.yearsLasting).toBe(5);
  });
});

describe("inflation, CAGR, budget", () => {
  it("purchasing power is the inverse of future cost", () => {
    expect(purchasingPower(134.3916379, 0.03, 10)).toBeCloseTo(100, 6);
  });
  it("CAGR series smooth line ends at the final value", () => {
    const s = cagrSeries([1000, 1300, 1100, 1600, 2000]);
    expect(s.points.at(-1)?.smooth).toBeCloseTo(2000, 6);
    expect(s.volatility).toBeGreaterThan(0);
    expect(s.bestYear).toBeCloseTo(0.4545, 3);
  });
  it("50/30/20 split", () => {
    const b = budgetSplit({ monthlyIncome: 5000, needs: 0.5, wants: 0.3, savings: 0.2 });
    expect([b.needs, b.wants, b.savings, b.valid]).toEqual([2500, 1500, 1000, true]);
    expect(budgetSplit({ monthlyIncome: 5000, needs: 0.5, wants: 0.3, savings: 0.3 }).valid).toBe(false);
  });
  it("emergency fund months to goal", () => {
    expect(emergencyFund({ monthlyExpenses: 3000, months: 6, currentSavings: 2000, monthlySaving: 500 })).toEqual({ target: 18000, remaining: 16000, monthsToGoal: 32 });
    expect(emergencyFund({ monthlyExpenses: 3000, months: 6, currentSavings: 0, monthlySaving: 0 }).monthsToGoal).toBeNull();
  });
});
