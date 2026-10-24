"use client";

import { useState } from "react";
import Link from "next/link";
import type { BudgetData } from "@/lib/budget/model";
import { projectGoal, sum } from "@/lib/budget/calc";
import { shiftMonth, monthLabel, monthKeyOf } from "@/lib/budget/dates";
import type { BudgetAction } from "@/lib/budget/reducer";
import { formatCurrency, formatDuration } from "@/lib/format";
import { MoneyInput, Panel, ProgressBar, dangerBtn, inputCls, smallBtn } from "./ui";

function ContributeForm({
  goalId,
  name,
  dispatch,
}: {
  goalId: string;
  name: string;
  dispatch: (a: BudgetAction) => void;
}) {
  const [amount, setAmount] = useState(0);
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (amount > 0) {
          dispatch({ type: "contributeGoal", id: goalId, amount });
          setAmount(0);
        }
      }}
    >
      <MoneyInput
        id={`goal-add-${goalId}`}
        label={`Add money to ${name}`}
        value={amount}
        onChange={setAmount}
        className="flex-1"
      />
      <button type="submit" className={smallBtn} disabled={amount <= 0}>
        Add
      </button>
    </form>
  );
}

export function Goals({
  data,
  today,
  dispatch,
}: {
  data: BudgetData;
  today: string;
  dispatch: (a: BudgetAction) => void;
}) {
  const needs = sum(data.categories.filter((c) => c.group === "needs").map((c) => c.planned));
  const hasEmergency = data.goals.some((g) => /emergency/i.test(g.name));
  return (
    <div className="space-y-6">
      <Panel
        title="Savings goals"
        id="goals-h"
        actions={
          <button type="button" className={smallBtn} onClick={() => dispatch({ type: "addGoal" })}>
            + Add goal
          </button>
        }
      >
        <p className="mb-4 text-sm text-ink-muted">
          Saving for something specific — a trip, a car, a new laptop? Set a target and a monthly
          amount and we&apos;ll show when you&apos;ll get there. Use “Add money” whenever you move
          cash into savings.
        </p>
        {!hasEmergency && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand/30 bg-brand-soft/40 p-4 text-sm">
            <p className="max-w-xl">
              <strong>Start with an emergency fund.</strong> It covers surprises like a job loss or
              car repair so they don&apos;t end up on a credit card. A common target is 3 months of
              needs
              {needs > 0 && <> — about {formatCurrency(needs * 3, { cents: false })} for you</>}.
            </p>
            <button
              type="button"
              className={smallBtn}
              onClick={() =>
                dispatch({
                  type: "addGoal",
                  goal: {
                    name: "Emergency fund",
                    target: Math.round(needs * 3) || 1000,
                    monthly: Math.round(needs * 0.1) || 100,
                  },
                })
              }
            >
              Add emergency fund
            </button>
          </div>
        )}
        {data.goals.length === 0 ? (
          <p className="rounded-lg bg-surface-2 p-4 text-sm text-ink-muted">No goals yet.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {data.goals.map((g) => {
              const p = projectGoal(g);
              const name = g.name || "Unnamed goal";
              const finish =
                p.monthsToGo && p.monthsToGo > 0
                  ? monthLabel(shiftMonth(monthKeyOf(today), p.monthsToGo))
                  : null;
              return (
                <li key={g.id} className="space-y-3 rounded-lg border border-border p-4">
                  <div>
                    <label htmlFor={`goal-name-${g.id}`} className="mb-1 block text-sm font-medium">
                      Goal
                    </label>
                    <input
                      id={`goal-name-${g.id}`}
                      className={inputCls}
                      maxLength={60}
                      value={g.name}
                      placeholder="e.g. Summer trip"
                      onChange={(e) =>
                        dispatch({ type: "updateGoal", id: g.id, patch: { name: e.target.value } })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
                    <MoneyInput
                      id={`goal-target-${g.id}`}
                      label="Target"
                      value={g.target}
                      onChange={(target) =>
                        dispatch({ type: "updateGoal", id: g.id, patch: { target } })
                      }
                    />
                    <MoneyInput
                      id={`goal-saved-${g.id}`}
                      label="Saved"
                      value={g.saved}
                      onChange={(saved) =>
                        dispatch({ type: "updateGoal", id: g.id, patch: { saved } })
                      }
                    />
                    <MoneyInput
                      id={`goal-monthly-${g.id}`}
                      label="Per month"
                      value={g.monthly}
                      onChange={(monthly) =>
                        dispatch({ type: "updateGoal", id: g.id, patch: { monthly } })
                      }
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold tabular-nums">
                        {Math.round(p.progress * 100)}%
                      </span>
                      <span className="tabular-nums text-ink-muted">
                        {formatCurrency(p.remaining, { cents: false })} to go
                      </span>
                    </div>
                    <ProgressBar value={p.progress} label={`${name} progress`} />
                    <p className="mt-1.5 text-sm text-ink-muted">
                      {p.monthsToGo === 0
                        ? "🎉 Goal reached!"
                        : p.monthsToGo === null
                          ? "Add a monthly amount to see when you'll reach it."
                          : `About ${formatDuration(p.monthsToGo)} to go — around ${finish}.`}
                    </p>
                  </div>
                  <ContributeForm goalId={g.id} name={name} dispatch={dispatch} />
                  <button
                    type="button"
                    className={dangerBtn}
                    aria-label={`Remove goal ${name}`}
                    onClick={() => {
                      if (window.confirm(`Remove the goal “${name}”?`))
                        dispatch({ type: "removeGoal", id: g.id });
                    }}
                  >
                    Remove goal
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-sm text-ink-muted">
          Want to include interest? Try the{" "}
          <Link
            href="/calculators/savings-goal/"
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            Savings Goal calculator
          </Link>
          .
        </p>
      </Panel>
    </div>
  );
}
