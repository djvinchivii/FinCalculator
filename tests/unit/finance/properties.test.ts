import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  amortize,
  compareStrategies,
  simulateCompound,
  solveContribution,
  solveTime,
  type Compounding,
  type Debt,
  type Frequency,
} from "@/lib/finance";

const compoundingArb = fc.constantFrom<Compounding>(1, 2, 4, 12, 26, 52, 365, "continuous");
const frequencyArb = fc.constantFrom<Frequency>(1, 2, 4, 12, 26, 52);
const rateArb = fc.integer({ min: 0, max: 3000 }).map((bp) => bp / 10_000); // 0%–30%

describe("amortization properties", () => {
  it("principal sums to the loan, balance never increases, final balance is 0", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 2_000_000 }),
        rateArb,
        fc.integer({ min: 1, max: 480 }),
        fc.constantFrom(12, 24, 26, 52 as const),
        fc.integer({ min: 0, max: 500 }),
        (principal, rate, termMonths, ppy, extra) => {
          const r = amortize({
            principal,
            annualRate: rate,
            termMonths,
            paymentsPerYear: ppy as 12 | 24 | 26 | 52,
            startDate: "2025-01-15",
            extras: { perPayment: extra },
          });
          const principalSum = r.rows.reduce((s, row) => s + Math.round((row.principal + row.extra) * 100), 0);
          expect(principalSum).toBe(Math.round(principal * 100));
          let prev = principal;
          for (const row of r.rows) {
            expect(row.balance).toBeLessThanOrEqual(prev + 1e-9);
            expect(row.interest).toBeGreaterThanOrEqual(0);
            prev = row.balance;
          }
          expect(r.rows.at(-1)?.balance).toBe(0);
          expect(r.interestSaved).toBeGreaterThanOrEqual(-0.01);
        },
      ),
      { numRuns: 120 },
    );
  });
});

describe("compound growth properties", () => {
  const base = { principal: 1000, contribution: 100, contributionFrequency: 12 as Frequency, timing: "end" as const, annualRate: 0.05, compounding: 12 as Compounding, years: 10 };
  it("increases monotonically with rate, time and contribution", () => {
    fc.assert(
      fc.property(
        rateArb,
        fc.integer({ min: 1, max: 60 }),
        fc.integer({ min: 0, max: 5000 }),
        compoundingArb,
        frequencyArb,
        (rate, years, contribution, compounding, freq) => {
          const at = (o: Partial<typeof base>) =>
            simulateCompound({ ...base, compounding, contributionFrequency: freq, annualRate: rate, years, contribution, ...o }).futureBalance;
          const v = at({});
          expect(at({ annualRate: rate + 0.01 })).toBeGreaterThan(v);
          expect(at({ years: years + 1 })).toBeGreaterThan(v);
          expect(at({ contribution: contribution + 10 })).toBeGreaterThan(v);
        },
      ),
      { numRuns: 80 },
    );
  });

  it("matches the closed form for mismatched frequencies with no contributions", () => {
    const r = simulateCompound({ ...base, contribution: 0, contributionFrequency: 4, compounding: 365, years: 7, principal: 5000 });
    expect(r.futureBalance).toBeCloseTo(5000 * (1 + 0.05 / 365) ** (365 * 7), 6);
  });
});

describe("savings goal properties", () => {
  it("the solved contribution reaches the target within $0.01", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1_000, max: 2_000_000 }),
        fc.integer({ min: 0, max: 500_000 }),
        rateArb,
        fc.integer({ min: 1, max: 40 }),
        compoundingArb,
        frequencyArb,
        fc.constantFrom("begin" as const, "end" as const),
        (target, current, rate, years, compounding, freq, timing) => {
          const goal = { target, current, annualRate: rate, compounding, contributionFrequency: freq, timing };
          const s = solveContribution({ ...goal, years });
          const sim = simulateCompound({
            principal: current,
            contribution: s.contribution,
            contributionFrequency: freq,
            timing,
            annualRate: rate,
            compounding,
            years,
          });
          if (s.alreadyOnTrack) {
            expect(sim.futureBalance).toBeGreaterThanOrEqual(target - 0.01);
          } else {
            expect(Math.abs(sim.futureBalance - target)).toBeLessThanOrEqual(0.01);
            // Solving for time with that contribution gives back the same horizon.
            const t = solveTime({ ...goal, contribution: s.contribution });
            expect(t.periods).not.toBeNull();
            expect(Math.abs((t.periods ?? 0) - s.periods)).toBeLessThan(1e-6);
          }
        },
      ),
      { numRuns: 150 },
    );
  });

  it("handles a zero rate", () => {
    const s = solveContribution({ target: 12_000, current: 0, annualRate: 0, compounding: 12, contributionFrequency: 12, timing: "end", years: 1 });
    expect(s.contribution).toBe(1000);
    const t = solveTime({ target: 12_000, current: 0, annualRate: 0, compounding: 12, contributionFrequency: 12, timing: "end", contribution: 1000 });
    expect(t.months).toBe(12);
  });
});

describe("debt strategy properties", () => {
  const debtArb = fc.record({
    balance: fc.integer({ min: 100, max: 30_000 }),
    aprBp: fc.integer({ min: 0, max: 3500 }),
    minPct: fc.integer({ min: 2, max: 6 }),
  });
  it("Avalanche total interest ≤ Snowball total interest", () => {
    fc.assert(
      fc.property(fc.array(debtArb, { minLength: 1, maxLength: 6 }), fc.integer({ min: 0, max: 2000 }), (raw, extra) => {
        const debts: Debt[] = raw.map((d, i) => ({
          id: `d${i}`,
          name: `Debt ${i}`,
          balance: d.balance,
          apr: d.aprBp / 10_000,
          minPayment: Math.max(25, Math.round((d.balance * d.minPct) / 100)),
        }));
        const budget = debts.reduce((s, d) => s + d.minPayment, 0) + extra;
        const c = compareStrategies(debts, budget);
        if (c.avalanche.status === "ok" && c.snowball.status === "ok") {
          // Allow a few cents of per-month rounding noise.
          expect(c.avalanche.totalInterest).toBeLessThanOrEqual(c.snowball.totalInterest + 0.05);
        }
      }),
      { numRuns: 150 },
    );
  });
});
