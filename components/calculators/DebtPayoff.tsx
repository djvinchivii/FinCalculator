"use client";

import { useFieldArray } from "react-hook-form";
import { z } from "zod";
import {
  addMonths,
  compareStrategies,
  parseISODate,
  simulateDebtPayoff,
  toISODate,
  type Debt,
  type DebtPayoffResult,
  type DebtStrategy,
  type StrategyComparison,
} from "@/lib/finance";
import { isoDate, money, percent } from "@/lib/schema";
import { formatCurrency, formatDuration, formatMonthYear, formatPercent } from "@/lib/format";
import { useCalculator } from "@/components/calculator/useCalculator";
import { CalculatorPanels, InputGroup } from "@/components/calculator/CalculatorPanels";
import { Alert, ResultSummary, type Stat } from "@/components/calculator/ResultSummary";
import { ScheduleTable } from "@/components/calculator/ScheduleTable";
import {
  CopyResultsButton,
  ExportButton,
  ShareButton,
} from "@/components/calculator/ActionButtons";
import {
  DateField,
  MoneyField,
  PercentField,
  TextField,
  ToggleField,
} from "@/components/ui/FormFields";
import { PayoffChart } from "@/components/charts";
import { localTodayISO } from "./loan-shared";

const MAX_DEBTS = 12;

const debtSchema = z.object({
  name: z.string().max(40, "Keep names under 40 characters"),
  balance: money(),
  apr: percent(),
  minPayment: money(),
});

const schema = z.object({
  debts: z.array(debtSchema).min(1, "Add at least one debt").max(MAX_DEBTS),
  budget: money(),
  strategy: z.enum(["avalanche", "snowball", "custom"]),
  startDate: isoDate(),
});

type Form = z.input<typeof schema>;
type Inputs = z.output<typeof schema>;

const defaults: Form = {
  debts: [
    { name: "Credit card", balance: "4,500", apr: "24.99", minPayment: "135" },
    { name: "Store card", balance: "1,200", apr: "29.99", minPayment: "40" },
    { name: "Car loan", balance: "9,800", apr: "6.9", minPayment: "290" },
  ],
  budget: "800",
  strategy: "avalanche",
  startDate: "2026-01-01",
};

const clientDefaults = (): Partial<Form> => ({ startDate: localTodayISO() });

interface Computed {
  debts: Debt[];
  chosen: DebtPayoffResult;
  comparison: StrategyComparison;
}

function toDebts(v: Inputs): Debt[] {
  return v.debts.map((d, i) => ({
    id: `d${i}`,
    name: d.name.trim() || `Debt ${i + 1}`,
    balance: d.balance,
    apr: d.apr,
    minPayment: d.minPayment,
  }));
}

const compute = (v: Inputs): Computed => {
  const debts = toDebts(v);
  const comparison = compareStrategies(debts, v.budget);
  const chosen =
    v.strategy === "avalanche"
      ? comparison.avalanche
      : v.strategy === "snowball"
        ? comparison.snowball
        : simulateDebtPayoff({ debts, monthlyBudget: v.budget, strategy: "custom" });
  return { debts, chosen, comparison };
};

function monthDate(startISO: string, months: number | null): string | null {
  const start = parseISODate(startISO);
  if (!start || months === null) return null;
  return toISODate(addMonths(start, months));
}

const STRATEGY_LABEL: Record<DebtStrategy, string> = {
  avalanche: "Avalanche",
  snowball: "Snowball",
  custom: "Your order",
};

function summaryText(v: Inputs, c: Computed): string {
  const r = c.chosen;
  if (r.status !== "ok" || r.months === null)
    return r.warnings[0] ?? "These debts won't be paid off with this budget.";
  const base = `Putting ${formatCurrency(v.budget, { cents: false })} a month toward your debts with the ${STRATEGY_LABEL[v.strategy]} method, you'll be debt-free in ${formatDuration(r.months)} (${formatMonthYear(monthDate(v.startDate, r.months))}) and pay ${formatCurrency(r.totalInterest, { cents: false })} in interest.`;
  const diff = c.comparison.interestDifference;
  if (c.comparison.avalanche.status === "ok" && c.comparison.snowball.status === "ok" && diff > 1) {
    return `${base} Avalanche saves ${formatCurrency(diff, { cents: false })} in interest compared with Snowball; Snowball gives you quicker early wins.`;
  }
  return base;
}

function DebtRows() {
  const { fields, append, remove, move } = useFieldArray<Form, "debts">({ name: "debts" });
  return (
    <InputGroup title="Your debts">
      <ol className="space-y-4">
        {fields.map((field, i) => (
          <li key={field.id} className="rounded-lg border border-border bg-surface-2/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">Debt {i + 1}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  className="min-h-[36px] min-w-[36px] rounded-md border border-border text-sm disabled:opacity-30"
                  aria-label={`Move debt ${i + 1} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === fields.length - 1}
                  className="min-h-[36px] min-w-[36px] rounded-md border border-border text-sm disabled:opacity-30"
                  aria-label={`Move debt ${i + 1} down`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={fields.length === 1}
                  className="min-h-[36px] rounded-md border border-border px-2 text-sm text-danger disabled:opacity-30"
                  aria-label={`Remove debt ${i + 1}`}
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="grid gap-3 min-[420px]:grid-cols-2">
              <TextField
                name={`debts.${i}.name`}
                label="Name"
                placeholder={`Debt ${i + 1}`}
                className="min-[420px]:col-span-2"
              />
              <MoneyField name={`debts.${i}.balance`} label="Balance" />
              <PercentField
                name={`debts.${i}.apr`}
                label="APR"
                tooltip={
                  i === 0
                    ? "Annual percentage rate. Monthly interest = balance × APR ÷ 12."
                    : undefined
                }
              />
              <MoneyField
                name={`debts.${i}.minPayment`}
                label="Minimum payment"
                className="min-[420px]:col-span-2"
                tooltip={
                  i === 0 ? "The smallest payment the lender requires each month." : undefined
                }
              />
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => append({ name: "", balance: "", apr: "", minPayment: "" })}
        disabled={fields.length >= MAX_DEBTS}
        className="min-h-[44px] w-full rounded-lg border-2 border-dashed border-border font-semibold text-ink-muted hover:border-brand hover:text-brand disabled:opacity-40"
      >
        + Add a debt
      </button>
    </InputGroup>
  );
}

function ComparisonTable({ c, startDate }: { c: StrategyComparison; startDate: string }) {
  const cols: [string, DebtPayoffResult][] = [
    ["Avalanche (highest APR first)", c.avalanche],
    ["Snowball (lowest balance first)", c.snowball],
  ];
  return (
    <section className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-6">
      <h2 className="mb-3 text-lg font-semibold">Avalanche vs. Snowball</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {cols.map(([label, r]) => {
          const better = label.startsWith("Avalanche")
            ? c.interestDifference > 0.5
            : c.interestDifference < -0.5;
          return (
            <div
              key={label}
              className={`rounded-lg border p-4 ${better ? "border-brand bg-brand-soft/40" : "border-border"}`}
            >
              <p className="text-sm font-semibold">{label}</p>
              {r.status === "ok" && r.months !== null ? (
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">Debt-free</dt>
                    <dd className="font-semibold">
                      {formatMonthYear(monthDate(startDate, r.months))}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">Time</dt>
                    <dd className="font-semibold">{formatDuration(r.months)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">Total interest</dt>
                    <dd className="font-semibold">{formatCurrency(r.totalInterest)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-2 text-sm text-danger">Never paid off with this budget.</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function DebtPayoff() {
  const { form, result, inputs, isStale, getShareUrl } = useCalculator(
    schema,
    defaults,
    compute,
    clientDefaults,
  );
  const rootError =
    form.formState.errors.debts?.root?.message ?? form.formState.errors.debts?.message;
  const r = result?.chosen;
  const ok = r?.status === "ok" && r.months !== null;

  const stats: Stat[] =
    r && inputs && ok
      ? [
          { label: "Time to debt-free", value: formatDuration(r.months ?? 0) },
          { label: "Total interest", value: formatCurrency(r.totalInterest), tone: "bad" },
          { label: "Total paid", value: formatCurrency(r.totalPaid) },
        ]
      : [];

  return (
    <CalculatorPanels
      form={form}
      isStale={isStale}
      inputs={
        <>
          <DebtRows />
          {rootError && <p className="text-sm font-medium text-danger">{rootError}</p>}
          <InputGroup title="Your plan">
            <MoneyField
              name="budget"
              label="Monthly budget for debt"
              tooltip="The total you can put toward all debts each month. Anything above the minimums goes to your target debt."
            />
            <ToggleField
              name="strategy"
              label="Strategy"
              options={[
                { value: "avalanche", label: "Avalanche" },
                { value: "snowball", label: "Snowball" },
                { value: "custom", label: "My order" },
              ]}
              tooltip="Avalanche targets the highest APR first (least interest). Snowball targets the smallest balance first (quick wins). 'My order' follows the list above — use ↑ ↓ to reorder."
            />
            <DateField
              name="startDate"
              label="Start date"
              hint="Used to turn months into payoff dates."
            />
          </InputGroup>
        </>
      }
      results={
        result &&
        inputs &&
        r && (
          <>
            <ResultSummary
              headlineLabel={`Debt-free date (${STRATEGY_LABEL[inputs.strategy]})`}
              headline={
                ok ? formatMonthYear(monthDate(inputs.startDate, r.months)) : "Never paid off"
              }
              summary={summaryText(inputs, result)}
              stats={stats}
              actions={
                <>
                  <ShareButton getUrl={getShareUrl} />
                  <CopyResultsButton
                    getText={() =>
                      [
                        `Debt payoff (${STRATEGY_LABEL[inputs.strategy]}): ${ok ? `debt-free ${formatMonthYear(monthDate(inputs.startDate, r.months))} (${formatDuration(r.months ?? 0)})` : "never paid off"}`,
                        ok ? `Total interest: ${formatCurrency(r.totalInterest)}` : "",
                        ...r.debts.map(
                          (d) =>
                            `  ${d.name}: ${d.payoffMonth !== null ? `paid off ${formatMonthYear(monthDate(inputs.startDate, d.payoffMonth))}` : "not paid off"}`,
                        ),
                        summaryText(inputs, result),
                        getShareUrl(),
                      ]
                        .filter(Boolean)
                        .join("\n")
                    }
                  />
                </>
              }
            />
            {r.warnings.map((w) => (
              <Alert key={w} tone={r.status === "ok" ? "warning" : "danger"}>
                {w}
              </Alert>
            ))}
            {ok && (
              <>
                <section className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-6">
                  <h2 className="mb-3 text-lg font-semibold">Payoff order</h2>
                  <ol className="space-y-2">
                    {r.order.map((id, idx) => {
                      const d = result.debts.find((x) => x.id === id);
                      const s = r.debts.find((x) => x.id === id);
                      if (!d || !s) return null;
                      return (
                        <li
                          key={id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm"
                        >
                          <span className="font-semibold">
                            {idx + 1}. {d.name}{" "}
                            <span className="font-normal text-ink-muted">
                              {formatCurrency(d.balance, { cents: false })} at{" "}
                              {formatPercent(d.apr)}
                            </span>
                          </span>
                          <span className="tabular-nums">
                            Paid off {formatMonthYear(monthDate(inputs.startDate, s.payoffMonth))} ·{" "}
                            {formatCurrency(s.interestPaid)} interest
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>
                <ComparisonTable c={result.comparison} startDate={inputs.startDate} />
                <PayoffChart
                  debts={r.order.map((id) => ({
                    id,
                    name: result.debts.find((d) => d.id === id)?.name ?? id,
                  }))}
                  data={[
                    { month: 0, ...Object.fromEntries(result.debts.map((d) => [d.id, d.balance])) },
                    ...r.timeline.map((m) => ({ month: m.month, ...m.balances })),
                  ]}
                />
                <ScheduleTable
                  title="Month-by-month balances"
                  rows={r.timeline}
                  rowKey={(m) => m.month}
                  columns={[
                    { header: "Month", cell: (m) => m.month, align: "left" },
                    {
                      header: "Date",
                      cell: (m) => formatMonthYear(monthDate(inputs.startDate, m.month)),
                      align: "left",
                    },
                    { header: "Paid", cell: (m) => formatCurrency(m.paid) },
                    { header: "Interest", cell: (m) => formatCurrency(m.interest) },
                    ...r.order.map((id) => ({
                      header: result.debts.find((d) => d.id === id)?.name ?? id,
                      cell: (m: (typeof r.timeline)[number]) => formatCurrency(m.balances[id] ?? 0),
                    })),
                    { header: "Total balance", cell: (m) => formatCurrency(m.totalBalance) },
                  ]}
                  actions={
                    <ExportButton
                      filename="debt-payoff-schedule"
                      rows={r.timeline}
                      columns={[
                        { header: "Month", value: (m) => m.month },
                        { header: "Date", value: (m) => monthDate(inputs.startDate, m.month) },
                        { header: "Paid", value: (m) => m.paid },
                        { header: "Interest", value: (m) => m.interest },
                        ...r.order.map((id) => ({
                          header: result.debts.find((d) => d.id === id)?.name ?? id,
                          value: (m: (typeof r.timeline)[number]) => m.balances[id] ?? 0,
                        })),
                        { header: "Total balance", value: (m) => m.totalBalance },
                      ]}
                    />
                  }
                />
              </>
            )}
          </>
        )
      }
    />
  );
}
