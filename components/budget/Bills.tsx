"use client";

import type { BillStatus } from "@/lib/budget/calc";
import { sum } from "@/lib/budget/calc";
import { monthLabel } from "@/lib/budget/dates";
import type { BudgetAction } from "@/lib/budget/reducer";
import { formatCurrency, formatDate } from "@/lib/format";
import { Panel, StatCard, smallBtn } from "./ui";

const STATE_LABEL: Record<BillStatus["state"], { text: string; cls: string }> = {
  paid: { text: "Paid", cls: "bg-brand-soft text-brand-strong dark:text-brand" },
  overdue: { text: "Overdue", cls: "bg-danger/15 text-danger" },
  "due-soon": { text: "Due soon", cls: "bg-warning-soft text-warning" },
  upcoming: { text: "Upcoming", cls: "bg-surface-2 text-ink-muted" },
};

function whenText(b: BillStatus): string {
  if (b.paid) return b.paidByTransactions ? "Payment logged" : "Marked paid";
  if (b.daysUntil === 0) return "Due today";
  if (b.daysUntil === 1) return "Due tomorrow";
  if (b.daysUntil > 1) return `Due in ${b.daysUntil} days`;
  return `${-b.daysUntil} day${b.daysUntil === -1 ? "" : "s"} late`;
}

export function Bills({
  bills,
  monthKey,
  dispatch,
  onGoTo,
}: {
  bills: BillStatus[];
  monthKey: string;
  dispatch: (a: BudgetAction) => void;
  onGoTo: (tab: "plan") => void;
}) {
  const total = sum(bills.map((b) => b.amount));
  const paid = sum(bills.filter((b) => b.paid).map((b) => b.amount));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <StatCard
          label="Bills this month"
          value={formatCurrency(total)}
          hint={`${bills.length} bill${bills.length === 1 ? "" : "s"}`}
        />
        <StatCard label="Paid" value={formatCurrency(paid)} tone="good" />
        <StatCard label="Still to pay" value={formatCurrency(Math.max(0, total - paid))} />
      </div>
      <Panel
        title={`Bills for ${monthLabel(monthKey)}`}
        id="bills-h"
        actions={
          <button type="button" className={smallBtn} onClick={() => onGoTo("plan")}>
            Add or change bills
          </button>
        }
      >
        {bills.length === 0 ? (
          <p className="rounded-lg bg-surface-2 p-4 text-sm text-ink-muted">
            No bills yet. In the Plan tab, choose a “Bill due” day for regular bills like rent,
            phone or insurance and they&apos;ll appear here with reminders.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {bills.map((b) => {
              const label = STATE_LABEL[b.state];
              const name = b.category.name || "Unnamed bill";
              return (
                <li key={b.category.id} className="flex flex-wrap items-center gap-3 py-3">
                  <input
                    id={`bill-${b.category.id}`}
                    type="checkbox"
                    className="h-5 w-5 shrink-0 accent-[rgb(var(--brand))]"
                    checked={b.paid}
                    disabled={b.paidByTransactions}
                    onChange={() =>
                      dispatch({ type: "toggleBillPaid", monthKey, categoryId: b.category.id })
                    }
                  />
                  <label
                    htmlFor={`bill-${b.category.id}`}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <span className="block font-medium text-ink">{name}</span>
                    <span className="block text-xs text-ink-muted">
                      {formatDate(b.dueDate)} · {whenText(b)}
                    </span>
                  </label>
                  <span className="font-semibold tabular-nums">{formatCurrency(b.amount)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${label.cls}`}>
                    {label.text}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-xs text-ink-muted">
          Tick a bill when you pay it. Bills are also marked paid automatically when you log
          payments in that category covering the planned amount.
        </p>
      </Panel>
    </div>
  );
}
