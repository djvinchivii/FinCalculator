"use client";

import {
  BUDGET_GROUPS,
  GROUP_INFO,
  INCOME_FREQUENCIES,
  type BudgetData,
  type BudgetGroup,
  type IncomeFrequency,
} from "@/lib/budget/model";
import { monthlyAmount, type MonthSummary } from "@/lib/budget/calc";
import type { BudgetAction } from "@/lib/budget/reducer";
import { formatCurrency } from "@/lib/format";
import { Tooltip } from "@/components/ui/Tooltip";
import { MoneyInput, Panel, dangerBtn, inputCls, smallBtn } from "./ui";

const DUE_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function PlanEditor({
  data,
  summary: s,
  dispatch,
}: {
  data: BudgetData;
  summary: MonthSummary;
  dispatch: (a: BudgetAction) => void;
}) {
  const balanced = Math.abs(s.leftToBudget) < 0.5;
  return (
    <div className="space-y-6">
      <div
        role="status"
        className={`sticky top-16 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border p-4 shadow-card backdrop-blur ${
          balanced
            ? "border-brand/40 bg-brand-soft/90"
            : s.leftToBudget < 0
              ? "border-danger/40 bg-surface/95"
              : "border-border bg-surface/95"
        }`}
      >
        <p className="text-sm text-ink-muted">
          Income{" "}
          <strong className="tabular-nums text-ink">{formatCurrency(s.plannedIncome)}</strong> −
          planned <strong className="tabular-nums text-ink">{formatCurrency(s.planned)}</strong>
        </p>
        <p className="text-sm">
          <span className="text-ink-muted">Left to budget: </span>
          <strong
            className={`text-lg tabular-nums ${s.leftToBudget < -0.5 ? "text-danger" : balanced ? "text-brand-strong dark:text-brand" : "text-ink"}`}
          >
            {s.leftToBudget < 0 ? "−" : ""}
            {formatCurrency(Math.abs(s.leftToBudget))}
          </strong>
          {balanced && <span className="ml-1">✅</span>}
        </p>
      </div>

      <Panel
        title="Income"
        id="income-h"
        actions={
          <button
            type="button"
            className={smallBtn}
            onClick={() => dispatch({ type: "addIncome" })}
          >
            + Add income
          </button>
        }
      >
        <p className="mb-4 text-sm text-ink-muted">
          Add each source of take-home pay (after taxes). Paid every two weeks? Enter one paycheck
          and choose “Every 2 weeks” — we&apos;ll work out the monthly amount.
        </p>
        {data.incomes.length === 0 ? (
          <p className="rounded-lg bg-surface-2 p-4 text-sm text-ink-muted">
            No income yet. Add your paycheck to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.incomes.map((inc, i) => (
              <li
                key={inc.id}
                className="grid grid-cols-2 items-end gap-3 rounded-lg border border-border p-3 sm:grid-cols-[2fr_1.4fr_1.6fr_auto]"
              >
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor={`inc-name-${inc.id}`} className="mb-1 block text-sm font-medium">
                    Source
                  </label>
                  <input
                    id={`inc-name-${inc.id}`}
                    className={inputCls}
                    value={inc.name}
                    maxLength={60}
                    placeholder={i === 0 ? "Paycheck" : "Side job"}
                    onChange={(e) =>
                      dispatch({
                        type: "updateIncome",
                        id: inc.id,
                        patch: { name: e.target.value },
                      })
                    }
                  />
                </div>
                <MoneyInput
                  id={`inc-amount-${inc.id}`}
                  label="Amount"
                  value={inc.amount}
                  onChange={(amount) =>
                    dispatch({ type: "updateIncome", id: inc.id, patch: { amount } })
                  }
                />
                <div>
                  <label htmlFor={`inc-freq-${inc.id}`} className="mb-1 block text-sm font-medium">
                    How often
                  </label>
                  <select
                    id={`inc-freq-${inc.id}`}
                    className={inputCls}
                    value={inc.frequency}
                    onChange={(e) =>
                      dispatch({
                        type: "updateIncome",
                        id: inc.id,
                        patch: { frequency: e.target.value as IncomeFrequency },
                      })
                    }
                  >
                    {Object.entries(INCOME_FREQUENCIES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:block">
                  <p className="text-xs text-ink-muted sm:mb-1">
                    ={" "}
                    <span className="font-semibold tabular-nums text-ink">
                      {formatCurrency(monthlyAmount(inc))}
                    </span>
                    /mo
                  </p>
                  <button
                    type="button"
                    className={dangerBtn}
                    aria-label={`Remove income ${inc.name || i + 1}`}
                    onClick={() => dispatch({ type: "removeIncome", id: inc.id })}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {BUDGET_GROUPS.map((group: BudgetGroup) => {
        const info = GROUP_INFO[group];
        const g = s.groups.find((x) => x.group === group);
        const cats = data.categories.filter((c) => c.group === group);
        return (
          <Panel
            key={group}
            title={info.label}
            id={`group-${group}-h`}
            actions={
              <button
                type="button"
                className={smallBtn}
                onClick={() => dispatch({ type: "addCategory", group })}
              >
                + Add category
              </button>
            }
          >
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 text-sm text-ink-muted">
              <p className="max-w-xl">{info.description}</p>
              <p className="tabular-nums">
                <strong className="text-ink">
                  {formatCurrency(g?.planned ?? 0, { cents: false })}
                </strong>
                {g?.shareOfIncome != null && ` · ${Math.round(g.shareOfIncome * 100)}% of income`}{" "}
                (guideline {Math.round(info.target * 100)}%)
              </p>
            </div>
            {cats.length === 0 ? (
              <p className="rounded-lg bg-surface-2 p-4 text-sm text-ink-muted">
                No categories here yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {cats.map((c) => (
                  <li
                    key={c.id}
                    className="grid grid-cols-2 items-end gap-3 rounded-lg border border-border p-3 sm:grid-cols-[2fr_1.3fr_1.3fr_1.3fr_auto]"
                  >
                    <div className="col-span-2 sm:col-span-1">
                      <label
                        htmlFor={`cat-name-${c.id}`}
                        className="mb-1 block text-sm font-medium"
                      >
                        Category
                      </label>
                      <input
                        id={`cat-name-${c.id}`}
                        className={inputCls}
                        value={c.name}
                        maxLength={60}
                        placeholder="e.g. Groceries"
                        onChange={(e) =>
                          dispatch({
                            type: "updateCategory",
                            id: c.id,
                            patch: { name: e.target.value },
                          })
                        }
                      />
                    </div>
                    <MoneyInput
                      id={`cat-planned-${c.id}`}
                      label="Monthly plan"
                      value={c.planned}
                      onChange={(planned) =>
                        dispatch({ type: "updateCategory", id: c.id, patch: { planned } })
                      }
                    />
                    <div>
                      <div className="mb-1 flex items-center gap-1">
                        <label htmlFor={`cat-due-${c.id}`} className="text-sm font-medium">
                          Bill due
                        </label>
                        <Tooltip term="Bill due">
                          Pick a day for regular bills like rent or your phone. They&apos;ll show up
                          in the Bills tab with reminders.
                        </Tooltip>
                      </div>
                      <select
                        id={`cat-due-${c.id}`}
                        className={inputCls}
                        value={c.dueDay ?? ""}
                        onChange={(e) =>
                          dispatch({
                            type: "updateCategory",
                            id: c.id,
                            patch: { dueDay: e.target.value ? Number(e.target.value) : null },
                          })
                        }
                      >
                        <option value="">Not a bill</option>
                        {DUE_DAYS.map((d) => (
                          <option key={d} value={d}>
                            The {ordinal(d)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor={`cat-group-${c.id}`}
                        className="mb-1 block text-sm font-medium"
                      >
                        Type
                      </label>
                      <select
                        id={`cat-group-${c.id}`}
                        className={inputCls}
                        value={c.group}
                        onChange={(e) =>
                          dispatch({
                            type: "updateCategory",
                            id: c.id,
                            patch: { group: e.target.value as BudgetGroup },
                          })
                        }
                      >
                        {BUDGET_GROUPS.map((gk) => (
                          <option key={gk} value={gk}>
                            {GROUP_INFO[gk].label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className={dangerBtn}
                      aria-label={`Remove category ${c.name || "unnamed"}`}
                      onClick={() => {
                        const used = data.transactions.some((t) => t.categoryId === c.id);
                        if (
                          !used ||
                          window.confirm(
                            `Remove “${c.name || "this category"}”? Its past spending will be kept as uncategorized.`,
                          )
                        ) {
                          dispatch({ type: "removeCategory", id: c.id });
                        }
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
