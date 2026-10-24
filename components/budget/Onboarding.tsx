"use client";

import { useState } from "react";
import { INCOME_FREQUENCIES, emptyBudget, type IncomeFrequency } from "@/lib/budget/model";
import { monthlyAmount } from "@/lib/budget/calc";
import { localToday } from "@/lib/budget/dates";
import { sampleBudget, starterBudget } from "@/lib/budget/templates";
import type { BudgetAction } from "@/lib/budget/reducer";
import { formatCurrency } from "@/lib/format";
import { MoneyInput, inputCls, primaryBtn, smallBtn } from "./ui";

/** First-visit setup: build a starter 50/30/20 budget from take-home pay, or explore sample data. */
export function Onboarding({ dispatch }: { dispatch: (a: BudgetAction) => void }) {
  const [pay, setPay] = useState(0);
  const [frequency, setFrequency] = useState<IncomeFrequency>("biweekly");
  const monthly = monthlyAmount({ amount: pay, frequency });

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <section
        aria-labelledby="setup-h"
        className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-8"
      >
        <h2 id="setup-h" className="text-2xl font-bold tracking-tight">
          Let&apos;s set up your budget
        </h2>
        <p className="mt-2 text-ink-muted">
          Tell us what you take home and we&apos;ll create a starter plan using the 50/30/20
          guideline. You can change every number afterwards.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (pay > 0) dispatch({ type: "replace", data: starterBudget(pay, frequency) });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <MoneyInput
              id="setup-pay"
              label="Take-home pay per paycheck"
              value={pay}
              onChange={setPay}
              placeholder="e.g. 1,850"
            />
            <div>
              <label htmlFor="setup-frequency" className="mb-1 block text-sm font-medium text-ink">
                How often you&apos;re paid
              </label>
              <select
                id="setup-frequency"
                className={inputCls}
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as IncomeFrequency)}
              >
                {Object.entries(INCOME_FREQUENCIES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm text-ink-muted">
            Take-home pay is what lands in your bank account after taxes.
            {pay > 0 && (
              <>
                {" "}
                That&apos;s about{" "}
                <strong className="text-ink">
                  {formatCurrency(monthly, { cents: false })} a month
                </strong>
                .
              </>
            )}
          </p>
          <button type="submit" className={primaryBtn} disabled={pay <= 0}>
            Create my budget
          </button>
        </form>
      </section>

      <aside className="space-y-4">
        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="font-semibold">Just looking around?</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Explore a realistic example month first. You can clear it whenever you&apos;re ready to
            add your own numbers.
          </p>
          <button
            type="button"
            className={`${smallBtn} mt-3`}
            onClick={() => dispatch({ type: "replace", data: sampleBudget(localToday()) })}
          >
            Try it with sample data
          </button>
        </div>
        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="font-semibold">Prefer a blank page?</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Start empty and add your own income and categories.
          </p>
          <button
            type="button"
            className={`${smallBtn} mt-3`}
            onClick={() =>
              dispatch({ type: "replace", data: { ...emptyBudget(), setupDone: true } })
            }
          >
            Start from scratch
          </button>
        </div>
        <p className="rounded-lg bg-surface-2 p-4 text-sm text-ink-muted">
          <span aria-hidden="true">🔒 </span>
          Your budget is saved only in this browser on this device. Nothing is sent to us.
        </p>
      </aside>
    </div>
  );
}
