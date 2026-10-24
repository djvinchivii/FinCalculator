"use client";

import { z } from "zod";
import {
  COMPOUNDING_OPTIONS,
  aprToApy,
  apyToApr,
  exactDoublingTime,
  ruleOf72,
  type Compounding,
} from "@/lib/finance";
import { compounding, percent, toOptions } from "@/lib/schema";
import { formatNumber, formatPercent, formatYears } from "@/lib/format";
import { useCalculator } from "@/components/calculator/useCalculator";
import { CalculatorPanels, InputGroup } from "@/components/calculator/CalculatorPanels";
import { ResultSummary } from "@/components/calculator/ResultSummary";
import { CopyResultsButton, ShareButton } from "@/components/calculator/ActionButtons";
import { PercentField, SelectField, ToggleField } from "@/components/ui/FormFields";
import { GrowthChart } from "@/components/charts";

const schema = z.object({
  direction: z.enum(["apr-to-apy", "apy-to-apr"]),
  rate: percent(),
  compounding: compounding(),
  doublingRate: percent({ exclusiveMin: true, min: 0, minMessage: "Enter a rate above 0%" }),
});

type Form = z.input<typeof schema>;
type Inputs = z.output<typeof schema>;

const defaults: Form = { direction: "apr-to-apy", rate: "5", compounding: "12", doublingRate: "8" };

interface Computed {
  apr: number;
  apy: number;
  rule72: number | null;
  exact: number | null;
  compounding: Compounding;
  table: { label: string; apy: number }[];
}

const compute = (v: Inputs): Computed => {
  const apr = v.direction === "apr-to-apy" ? v.rate : apyToApr(v.rate, v.compounding);
  const apy = v.direction === "apr-to-apy" ? aprToApy(v.rate, v.compounding) : v.rate;
  return {
    apr,
    apy,
    rule72: ruleOf72(v.doublingRate),
    exact: exactDoublingTime(v.doublingRate),
    compounding: v.compounding,
    table: COMPOUNDING_OPTIONS.map((o) => ({ label: o.label, apy: aprToApy(apr, o.value) })),
  };
};

function compLabel(c: Compounding): string {
  return COMPOUNDING_OPTIONS.find((o) => o.value === c)?.label.toLowerCase() ?? "";
}

function doublingSentence(v: Inputs, r: Computed): string {
  if (r.rule72 === null || r.exact === null) return "";
  const diff = r.rule72 - r.exact;
  const closeness =
    Math.abs(diff) < 0.1
      ? "almost exactly right"
      : diff > 0
        ? `${formatNumber(Math.abs(diff), 2)} years too long`
        : `${formatNumber(Math.abs(diff), 2)} years too short`;
  return `At ${formatPercent(v.doublingRate)} a year, money doubles in ${formatNumber(r.exact, 3)} years. The Rule of 72 (72 ÷ ${formatNumber(v.doublingRate * 100, 2)}) estimates ${formatNumber(r.rule72, 2)} years — ${closeness}. The shortcut works best for rates around 6%–10%; it drifts at very low or very high rates because it approximates the natural logarithm ln(1 + r) with a straight line.`;
}

export default function RateTools() {
  const { form, result, inputs, isStale, getShareUrl } = useCalculator(schema, defaults, compute);
  const direction = form.watch("direction");

  return (
    <CalculatorPanels
      form={form}
      isStale={isStale}
      inputs={
        <>
          <InputGroup title="APR ↔ APY converter">
            <ToggleField
              name="direction"
              label="Convert"
              options={[
                { value: "apr-to-apy", label: "APR → APY" },
                { value: "apy-to-apr", label: "APY → APR" },
              ]}
            />
            <PercentField
              name="rate"
              label={
                direction === "apr-to-apy"
                  ? "APR (nominal annual rate)"
                  : "APY (effective annual yield)"
              }
              slider={{ min: 0, max: 30, step: 0.05 }}
              tooltip={
                direction === "apr-to-apy"
                  ? "APR is the stated yearly rate before compounding is taken into account."
                  : "APY is what you actually earn or pay in a year once compounding is included."
              }
            />
            <SelectField
              name="compounding"
              label="Compounding frequency"
              options={toOptions(COMPOUNDING_OPTIONS)}
              tooltip="How often interest is added to the balance; more often means a higher APY for the same APR."
            />
          </InputGroup>
          <InputGroup title="Rule of 72">
            <PercentField
              name="doublingRate"
              label="Annual return"
              slider={{ min: 1, max: 30, step: 0.5 }}
              tooltip="The yearly growth rate (compounded annually) used to estimate doubling time."
            />
          </InputGroup>
        </>
      }
      results={
        result &&
        inputs && (
          <>
            <ResultSummary
              headlineLabel={
                inputs.direction === "apr-to-apy"
                  ? "APY (effective annual yield)"
                  : "APR (nominal annual rate)"
              }
              headline={formatPercent(
                inputs.direction === "apr-to-apy" ? result.apy : result.apr,
                4,
              )}
              summary={`An APR of ${formatPercent(result.apr, 4)} compounded ${compLabel(result.compounding)} is the same as an APY of ${formatPercent(result.apy, 4)}. Compare savings accounts by APY and loans by APR — but remember a loan's true yearly cost is its APY.`}
              stats={[
                { label: "APR", value: formatPercent(result.apr, 4) },
                { label: "APY", value: formatPercent(result.apy, 4) },
                {
                  label: "Compounding boost",
                  value: formatPercent(result.apy - result.apr, 4),
                  hint: "APY − APR",
                },
              ]}
              actions={
                <>
                  <ShareButton getUrl={getShareUrl} />
                  <CopyResultsButton
                    getText={() =>
                      [
                        `APR ${formatPercent(result.apr, 4)} compounded ${compLabel(result.compounding)} = APY ${formatPercent(result.apy, 4)}`,
                        `Doubling at ${formatPercent(inputs.doublingRate)}: Rule of 72 ≈ ${formatYears(result.rule72 ?? NaN)}; exact = ${formatYears(result.exact ?? NaN, 3)}`,
                        getShareUrl(),
                      ].join("\n")
                    }
                  />
                </>
              }
            />
            <section className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-6">
              <h2 className="mb-3 text-lg font-semibold">Doubling time</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-surface-2 p-4">
                  <p className="text-sm text-ink-muted">Rule of 72 estimate</p>
                  <p className="text-3xl font-bold tabular-nums" data-testid="rule72">
                    {formatYears(result.rule72 ?? NaN)}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-2 p-4">
                  <p className="text-sm text-ink-muted">Exact: ln 2 ÷ ln(1 + r)</p>
                  <p
                    className="text-3xl font-bold tabular-nums text-brand"
                    data-testid="exact-doubling"
                  >
                    {formatYears(result.exact ?? NaN, 3)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                {doublingSentence(inputs, result)}
              </p>
            </section>
            <section className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-6">
              <h2 className="mb-3 text-lg font-semibold">Same APR, different compounding</h2>
              <table className="w-full text-sm tabular-nums">
                <caption className="sr-only">
                  APY for an APR of {formatPercent(result.apr, 4)} at each compounding frequency
                </caption>
                <thead>
                  <tr className="text-ink-muted">
                    <th scope="col" className="py-1 text-left font-medium">
                      Compounding
                    </th>
                    <th scope="col" className="py-1 text-right font-medium">
                      APY
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.table.map((row) => (
                    <tr key={row.label} className="border-t border-border/60">
                      <th scope="row" className="py-1.5 text-left font-normal">
                        {row.label}
                      </th>
                      <td className="py-1.5 text-right font-semibold">
                        {formatPercent(row.apy, 4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <GrowthChart
              title="Rule of 72 vs. exact doubling time"
              variant="line"
              xKey="rate"
              xLabel="Rate"
              formatX={(v) => `${v}%`}
              formatValue={(v) => formatYears(v)}
              formatAxis={(v) => `${formatNumber(v, 0)}y`}
              data={[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30].map((p) => ({
                rate: p,
                rule: ruleOf72(p / 100),
                exact: exactDoublingTime(p / 100),
              }))}
              series={[
                { key: "exact", label: "Exact", color: "rgb(var(--chart-2))" },
                { key: "rule", label: "Rule of 72", color: "rgb(var(--chart-3))", dashed: true },
              ]}
            />
          </>
        )
      }
    />
  );
}
