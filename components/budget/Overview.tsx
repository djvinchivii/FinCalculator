"use client";

import { BUDGET_GROUPS, GROUP_INFO } from "@/lib/budget/model";
import type { BillStatus, Insight, MonthSummary } from "@/lib/budget/calc";
import { formatCurrency, formatDate } from "@/lib/format";
import { BreakdownDonut } from "@/components/charts";
import { Panel, ProgressBar, StatCard, smallBtn, type BarTone } from "./ui";

const INSIGHT_STYLE: Record<Insight["tone"], { icon: string; cls: string }> = {
  good: { icon: "✅", cls: "border-brand/40 bg-brand-soft/40" },
  info: { icon: "💡", cls: "border-border bg-surface-2" },
  warning: { icon: "⚠️", cls: "border-warning/30 bg-warning-soft" },
  danger: { icon: "🚩", cls: "border-danger/40 bg-danger/10" },
};

export function Overview({
  summary: s,
  bills,
  insights,
  onGoTo,
}: {
  summary: MonthSummary;
  bills: BillStatus[];
  insights: Insight[];
  onGoTo: (tab: "plan" | "transactions" | "bills") => void;
}) {
  const upcoming = bills.filter((b) => !b.paid).slice(0, 4);
  const spentByGroup: { key: string; label: string; value: number; color: string }[] =
    BUDGET_GROUPS.map((g) => ({
      key: g,
      label: GROUP_INFO[g].label,
      value: s.groups.find((x) => x.group === g)?.spent ?? 0,
      color: GROUP_INFO[g].color,
    }));
  if (s.uncategorizedSpent > 0) {
    spentByGroup.push({
      key: "uncategorized",
      label: "Uncategorized",
      value: s.uncategorizedSpent,
      color: "rgb(var(--chart-4))",
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Monthly income"
          value={formatCurrency(s.plannedIncome)}
          hint={
            s.receivedIncome > 0
              ? `${formatCurrency(s.receivedIncome)} received this month`
              : "from your income sources"
          }
        />
        <StatCard
          label="Planned spending"
          value={formatCurrency(s.planned)}
          hint="your plan for every category"
        />
        <StatCard
          label="Spent so far"
          value={formatCurrency(s.spent)}
          testId="spent-total"
          hint="this month's expenses"
        />
        <StatCard
          label={s.leftToSpend < 0 ? "Over budget by" : "Left to spend"}
          value={formatCurrency(Math.abs(s.leftToSpend))}
          tone={s.leftToSpend < 0 ? "bad" : "good"}
          testId="left-to-spend"
          hint={
            s.safePerDay !== null
              ? `≈ ${formatCurrency(s.safePerDay)} a day for flexible spending`
              : undefined
          }
        />
      </div>

      <div
        className={`rounded-card border p-4 sm:p-5 ${
          Math.abs(s.leftToBudget) < 0.5
            ? "border-brand/40 bg-brand-soft/40"
            : s.leftToBudget < 0
              ? "border-danger/40 bg-danger/10"
              : "border-border bg-surface"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink-muted">Left to budget</p>
            <p className="text-2xl font-bold tabular-nums" data-testid="left-to-budget">
              {s.leftToBudget < 0 ? "−" : ""}
              {formatCurrency(Math.abs(s.leftToBudget))}
            </p>
          </div>
          <p className="max-w-xl text-sm text-ink-muted">
            {Math.abs(s.leftToBudget) < 0.5
              ? "Every dollar has a job. That's the goal of a zero-based budget!"
              : s.leftToBudget < 0
                ? "Your plan spends more than you earn. Lower a few categories until this reaches $0."
                : "Income that isn't planned yet. Give it a job — savings or a goal is a great choice."}
          </p>
          <button type="button" className={smallBtn} onClick={() => onGoTo("plan")}>
            Edit plan
          </button>
        </div>
      </div>

      {insights.length > 0 && (
        <Panel title="Tips for this month" id="insights-h">
          <ul className="space-y-2">
            {insights.map((i) => (
              <li
                key={i.text}
                className={`flex gap-3 rounded-lg border px-3 py-2.5 text-sm leading-relaxed ${INSIGHT_STYLE[i.tone].cls}`}
              >
                <span aria-hidden="true">{INSIGHT_STYLE[i.tone].icon}</span>
                <span>{i.text}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Your split vs. 50/30/20" id="split-h">
          <ul className="space-y-4">
            {s.groups.map((g) => {
              const info = GROUP_INFO[g.group];
              const share = g.shareOfIncome;
              return (
                <li key={g.group}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                    <span className="font-semibold text-ink">{info.label}</span>
                    <span className="tabular-nums text-ink-muted">
                      {share === null ? "—" : `${Math.round(share * 100)}%`} of income · guideline{" "}
                      {Math.round(info.target * 100)}%
                    </span>
                  </div>
                  <div className="relative mt-1.5">
                    <ProgressBar
                      value={share ?? 0}
                      tone={
                        share !== null && g.group !== "savings" && share > info.target + 0.05
                          ? "near"
                          : "neutral"
                      }
                      label={`${info.label}: planned share of income`}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 w-0.5 bg-ink"
                      style={{ left: `${info.target * 100}%`, height: "1.1rem" }}
                      title={`Guideline ${Math.round(info.target * 100)}%`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {formatCurrency(g.spent, { cents: false })} spent of{" "}
                    {formatCurrency(g.planned, { cents: false })} planned
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-ink-muted">
            The black line marks the 50/30/20 guideline. It&apos;s a starting point, not a rule.
          </p>
        </Panel>

        <Panel
          title="Upcoming bills"
          id="upcoming-h"
          actions={
            <button type="button" className={smallBtn} onClick={() => onGoTo("bills")}>
              All bills
            </button>
          }
        >
          {upcoming.length === 0 ? (
            <p className="text-sm text-ink-muted">
              {bills.length === 0
                ? "No bills yet. In the Plan tab, give a category a due day to track it as a bill."
                : "All bills for this month are paid. 🎉"}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((b) => (
                <li
                  key={b.category.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span>
                    <span className="font-medium text-ink">
                      {b.category.name || "Unnamed bill"}
                    </span>
                    <span className="block text-xs text-ink-muted">
                      Due {formatDate(b.dueDate)}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="font-semibold tabular-nums">{formatCurrency(b.amount)}</span>
                    <span
                      className={`block text-xs font-semibold ${b.state === "overdue" ? "text-danger" : b.state === "due-soon" ? "text-warning" : "text-ink-muted"}`}
                    >
                      {b.state === "overdue"
                        ? "Overdue"
                        : b.state === "due-soon"
                          ? "Due soon"
                          : "Upcoming"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Spending by category"
        id="categories-h"
        actions={
          <button type="button" className={smallBtn} onClick={() => onGoTo("transactions")}>
            Add spending
          </button>
        }
      >
        {s.categories.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Add categories in the Plan tab to see your progress here.
          </p>
        ) : (
          <div className="space-y-6">
            {BUDGET_GROUPS.map((group) => {
              const rows = s.categories.filter((c) => c.category.group === group);
              if (rows.length === 0) return null;
              return (
                <div key={group}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    {GROUP_INFO[group].label}
                  </h3>
                  <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2">
                    {rows.map((c) => {
                      const tone: BarTone =
                        c.state === "over" || c.state === "unplanned"
                          ? "over"
                          : c.state === "near"
                            ? "near"
                            : "ok";
                      const name = c.category.name || "Unnamed category";
                      return (
                        <li key={c.category.id}>
                          <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="truncate font-medium text-ink">{name}</span>
                            <span className="shrink-0 tabular-nums text-ink-muted">
                              {formatCurrency(c.spent, { cents: false })} /{" "}
                              {formatCurrency(c.category.planned, { cents: false })}
                            </span>
                          </div>
                          <div className="mt-1.5">
                            <ProgressBar
                              value={c.used ?? (c.spent > 0 ? 1 : 0)}
                              tone={tone}
                              label={`${name}: spent of planned`}
                            />
                          </div>
                          <p
                            className={`mt-1 text-xs ${c.remaining < 0 ? "font-semibold text-danger" : "text-ink-muted"}`}
                          >
                            {c.remaining < 0
                              ? `${formatCurrency(-c.remaining)} over`
                              : c.category.planned > 0
                                ? `${formatCurrency(c.remaining)} left`
                                : "Not in your plan"}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {s.spent > 0 && (
        <BreakdownDonut
          title="Where your money went this month"
          centerLabel="Spent"
          centerValue={formatCurrency(s.spent, { cents: false })}
          slices={spentByGroup}
        />
      )}
    </div>
  );
}
