import { describe, expect, it } from "vitest";
import {
  amortize,
  annuityFutureValue,
  aprToApy,
  apyToApr,
  cagr,
  compoundClosedForm,
  exactDoublingTime,
  futureCost,
  loanPayment,
  loanPaymentExact,
  periodRate,
  realReturn,
  ruleOf72,
  simpleInterest,
  simulateCompound,
  simulateDebtPayoff,
} from "@/lib/finance";

const CENT = 0.01;

describe("§7 test vectors", () => {
  it("#1 compound: $10,000 at 5% monthly for 10 years → $16,470.09", () => {
    expect(compoundClosedForm(10_000, 0.05, 12, 10)).toBeCloseTo(16_470.09, 2);
    const sim = simulateCompound({
      principal: 10_000,
      contribution: 0,
      contributionFrequency: 12,
      timing: "end",
      annualRate: 0.05,
      compounding: 12,
      years: 10,
    });
    expect(Math.abs(sim.futureBalance - 16_470.09)).toBeLessThanOrEqual(CENT);
    expect(sim.totalContributed).toBe(10_000);
  });

  it("#2 annuity: $500/mo end-of-period, 7% monthly, 30 years ≈ $609,985 (±$1)", () => {
    const sim = simulateCompound({
      principal: 0,
      contribution: 500,
      contributionFrequency: 12,
      timing: "end",
      annualRate: 0.07,
      compounding: 12,
      years: 30,
    });
    expect(Math.abs(sim.futureBalance - 609_985)).toBeLessThanOrEqual(1);
    const closed = annuityFutureValue(500, periodRate(0.07, 12, 12), 360, "end");
    expect(Math.abs(sim.futureBalance - closed)).toBeLessThanOrEqual(CENT);
    expect(sim.totalContributed).toBe(180_000);
  });

  it("#3 loan payment: $200,000 at 6% for 30 years → $1,199.10/mo", () => {
    expect(loanPayment(200_000, 0.06, 360, 12)).toBe(1_199.1);
  });

  it("#4 loan total interest ≈ $231,676 (±$1), final balance exactly $0.00", () => {
    // Unrounded level payment × 360 − principal = $231,676.38.
    const exactInterest = loanPaymentExact(200_000, 0.005, 360).times(360).minus(200_000).toNumber();
    expect(Math.abs(exactInterest - 231_676)).toBeLessThanOrEqual(1);
    // The cent-rounded schedule ($1,199.10 × 359 + a $1,200.14 final payment that absorbs the
    // rounding drift) lands $0.66 above that: $231,677.04.
    const r = amortize({ principal: 200_000, annualRate: 0.06, termMonths: 360, paymentsPerYear: 12, startDate: "2025-01-01" });
    expect(r.totalInterest).toBeCloseTo(231_677.04, 2);
    expect(Math.abs(r.totalInterest - exactInterest)).toBeLessThanOrEqual(1);
    expect(r.rows.at(-1)?.payment).toBe(1_200.14);
    expect(r.rows).toHaveLength(360);
    expect(r.rows.at(-1)?.balance).toBe(0);
  });

  it("#5 zero-rate loan: $12,000, 0%, 12 months → $1,000/mo, $0 interest", () => {
    const r = amortize({ principal: 12_000, annualRate: 0, termMonths: 12, paymentsPerYear: 12, startDate: "2025-01-01" });
    expect(r.payment).toBe(1_000);
    expect(r.totalInterest).toBe(0);
    expect(r.rows.at(-1)?.balance).toBe(0);
  });

  it("#6 APR→APY: 5% monthly → 5.1162% (±0.0001%)", () => {
    expect(Math.abs(aprToApy(0.05, 12) * 100 - 5.1162)).toBeLessThanOrEqual(0.0001);
    expect(apyToApr(aprToApy(0.05, 12), 12)).toBeCloseTo(0.05, 12);
    expect(aprToApy(0.05, "continuous")).toBeCloseTo(Math.exp(0.05) - 1, 12);
  });

  it("#7 doubling time at 8%: Rule of 72 = 9.00, exact = 9.006", () => {
    expect(ruleOf72(0.08)).toBeCloseTo(9, 10);
    expect(exactDoublingTime(0.08)).toBeCloseTo(9.006, 3);
  });

  it("#8 inflation: $100 at 3% for 10 years → $134.39", () => {
    expect(futureCost(100, 0.03, 10)).toBeCloseTo(134.39, 2);
  });

  it("#9 Fisher real return: 7% nominal, 3% inflation → 3.8835%", () => {
    expect(realReturn(0.07, 0.03) * 100).toBeCloseTo(3.8835, 4);
  });

  it("#10 simple interest: $1,000 at 5% for 3 years → $150.00", () => {
    const r = simpleInterest({ principal: 1_000, rate: 0.05, time: 3, unit: "years", basis: 365 });
    expect(r.interest).toBe(150);
    expect(r.total).toBe(1_150);
  });

  it("#11 CAGR: $1,000 → $2,000 in 5 years → 14.87%", () => {
    expect((cagr(1_000, 2_000, 5) ?? 0) * 100).toBeCloseTo(14.87, 2);
  });

  it("#12 debt payoff: $1,000 at 24% APR paying $15/mo → never paid off", () => {
    const r = simulateDebtPayoff({
      debts: [{ id: "a", name: "Card", balance: 1_000, apr: 0.24, minPayment: 15 }],
      monthlyBudget: 15,
      strategy: "avalanche",
    });
    expect(r.status).toBe("never");
    expect(r.months).toBeNull();
    expect(r.warnings.join(" ")).toMatch(/never be paid off/);
  });
});
