"use client";

import { z } from "zod";
import { HORIZON_AGE, projectRetirement, type RetirementResult } from "@/lib/finance";
import { money, numberText, percent } from "@/lib/schema";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { pctPhrase } from "@/lib/text";
import { useCalculator } from "@/components/calculator/useCalculator";
import { CalculatorPanels, InputGroup } from "@/components/calculator/CalculatorPanels";
import { Alert, ResultSummary } from "@/components/calculator/ResultSummary";
import { ScheduleTable } from "@/components/calculator/ScheduleTable";
import {
  CopyResultsButton,
  ExportButton,
  ShareButton,
} from "@/components/calculator/ActionButtons";
import { MoneyField, NumberField, PercentField } from "@/components/ui/FormFields";
import { GrowthChart } from "@/components/charts";

const age = (label: string) =>
  numberText({ min: 0, max: 110, maxMessage: `${label} must be 110 or less` });

const schema = z
  .object({
    currentAge: age("Age"),
    retirementAge: age("Retirement age"),
    currentSavings: money({ optional: true }),
    monthlyContribution: money({ optional: true }),
    preReturn: percent({ max: 30, maxMessage: "Use a return of 30% or less" }),
    postReturn: percent({ max: 30, maxMessage: "Use a return of 30% or less" }),
    inflation: percent({ optional: true, max: 30, maxMessage: "Use inflation of 30% or less" }),
    annualSpending: money({ optional: true }),
    withdrawalRate: percent({
      exclusiveMin: true,
      min: 0,
      max: 20,
      minMessage: "Use a withdrawal rate above 0%",
      maxMessage: "Use a withdrawal rate of 20% or less",
    }),
  })
  .superRefine((v, ctx) => {
    if (v.retirementAge < v.currentAge) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["retirementAge"],
        message: "Retirement age can’t be before your current age",
      });
    }
    if (v.retirementAge - v.currentAge > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["retirementAge"],
        message: "Projections are capped at 100 years",
      });
    }
  });

type Form = z.input<typeof schema>;
type Inputs = z.output<typeof schema>;

const defaults: Form = {
  currentAge: "30",
  retirementAge: "60",
  currentSavings: "50,000",
  monthlyContribution: "1,000",
  preReturn: "7",
  postReturn: "5",
  inflation: "3",
  annualSpending: "50,000",
  withdrawalRate: "4",
};

const compute = (v: Inputs): RetirementResult => projectRetirement(v);

function lastsText(r: RetirementResult): string {
  return r.depletionAge === null
    ? `past age ${HORIZON_AGE}`
    : `until age ${formatNumber(r.depletionAge, 1)}`;
}

function summaryText(v: Inputs, r: RetirementResult): string {
  const fire =
    r.fireAge === null
      ? `At this pace you won't reach your FIRE number of ${formatCurrency(r.fireNumber, { cents: false })} (in today's dollars) by age 100.`
      : r.fireAge <= v.retirementAge
        ? `You'd hit your FIRE number of ${formatCurrency(r.fireNumber, { cents: false })} at about age ${formatNumber(r.fireAge, 1)} — on track.`
        : `You'd hit your FIRE number of ${formatCurrency(r.fireNumber, { cents: false })} at about age ${formatNumber(r.fireAge, 1)}, after your planned retirement.`;
  return `Saving ${formatCurrency(v.monthlyContribution, { cents: false })} a month from age ${v.currentAge} at ${pctPhrase(v.preReturn)}, you'd retire at ${v.retirementAge} with about ${formatCurrency(r.nestEgg, { cents: false })} — worth ${formatCurrency(r.nestEggReal, { cents: false })} in today's dollars. ${fire} Spending ${formatCurrency(v.annualSpending, { cents: false })} a year (today's dollars, rising with inflation), your money lasts ${lastsText(r)}.`;
}

export default function Retirement() {
  const { form, result, inputs, isStale, getShareUrl } = useCalculator(schema, defaults, compute);

  return (
    <CalculatorPanels
      form={form}
      isStale={isStale}
      inputs={
        <>
          <InputGroup title="You today">
            <div className="grid grid-cols-2 gap-3">
              <NumberField name="currentAge" label="Current age" grouping={false} />
              <NumberField
                name="retirementAge"
                label="Retirement age"
                grouping={false}
                tooltip="The age you plan to stop contributing and start withdrawing."
              />
            </div>
            <MoneyField
              name="currentSavings"
              label="Current retirement savings"
              tooltip="Everything already invested for retirement (401(k), IRA, brokerage)."
            />
            <MoneyField
              name="monthlyContribution"
              label="Monthly contribution"
              tooltip="How much you add each month until retirement."
            />
          </InputGroup>
          <InputGroup title="Assumptions">
            <PercentField
              name="preReturn"
              label="Return before retirement"
              slider={{ min: 0, max: 12, step: 0.1 }}
              tooltip="Expected average yearly investment return while you're saving."
            />
            <PercentField
              name="postReturn"
              label="Return during retirement"
              slider={{ min: 0, max: 10, step: 0.1 }}
              tooltip="Expected yearly return once retired — often lower, as portfolios get more conservative."
            />
            <PercentField
              name="inflation"
              label="Inflation"
              tooltip="How fast prices rise each year. Used to show results in today's dollars and grow your spending."
            />
          </InputGroup>
          <InputGroup title="Retirement spending">
            <MoneyField
              name="annualSpending"
              label="Annual spending (today's dollars)"
              tooltip="What you'd want to spend each year in retirement, in today's money."
            />
            <PercentField
              name="withdrawalRate"
              label="Safe withdrawal rate"
              tooltip="The share of your portfolio you withdraw in year one. 4% is a common rule of thumb from historical studies."
            />
          </InputGroup>
        </>
      }
      results={
        result &&
        inputs && (
          <>
            <ResultSummary
              headlineLabel={`Projected nest egg at ${inputs.retirementAge}`}
              headline={formatCurrency(result.nestEgg, { cents: false })}
              summary={summaryText(inputs, result)}
              stats={[
                {
                  label: "In today's dollars",
                  value: formatCurrency(result.nestEggReal, { cents: false }),
                },
                {
                  label: "FIRE number (today's $)",
                  value: formatCurrency(result.fireNumber, { cents: false }),
                  hint: `${formatCurrency(result.fireNumberAtRetirement, { cents: false })} in future dollars at ${inputs.retirementAge}`,
                },
                {
                  label: "Age you hit FIRE",
                  value: result.fireAge === null ? "Not by 100" : formatNumber(result.fireAge, 1),
                  tone: result.onTrack ? "good" : "bad",
                },
                {
                  label: "Money lasts",
                  value:
                    result.depletionAge === null
                      ? `Past ${HORIZON_AGE}`
                      : `To age ${formatNumber(result.depletionAge, 1)}`,
                  tone: result.depletionAge === null || result.depletionAge >= 90 ? "good" : "bad",
                  hint:
                    result.yearsLasting !== null
                      ? `${formatNumber(result.yearsLasting, 1)} years of retirement`
                      : undefined,
                },
                {
                  label: "First-year withdrawal",
                  value: formatCurrency(result.firstYearSpendingNominal, { cents: false }),
                  hint:
                    result.nestEgg > 0
                      ? `${formatPercent(result.firstYearSpendingNominal / result.nestEgg, 1)} of nest egg`
                      : undefined,
                },
              ]}
              actions={
                <>
                  <ShareButton getUrl={getShareUrl} />
                  <CopyResultsButton
                    getText={() =>
                      [
                        `Projected nest egg at ${inputs.retirementAge}: ${formatCurrency(result.nestEgg)} (${formatCurrency(result.nestEggReal)} today's dollars)`,
                        `FIRE number: ${formatCurrency(result.fireNumber)} (today's dollars)`,
                        `FIRE age: ${result.fireAge ?? "not by 100"}`,
                        `Money lasts ${lastsText(result)}`,
                        getShareUrl(),
                      ].join("\n")
                    }
                  />
                </>
              }
            />
            {result.depletionAge !== null && result.depletionAge < 90 && (
              <Alert tone="warning">
                Your savings run out at about age {formatNumber(result.depletionAge, 1)}. Consider
                saving more, retiring later, or spending less.
              </Alert>
            )}
            <GrowthChart
              title="Your portfolio over time (nominal vs. today's dollars)"
              variant="area"
              xKey="age"
              xLabel="Age"
              data={[
                {
                  age: inputs.currentAge,
                  balance: inputs.currentSavings,
                  real: inputs.currentSavings,
                },
                ...result.rows.map((r) => ({
                  age: r.age,
                  balance: r.balance,
                  real: r.realBalance,
                })),
              ]}
              series={[
                { key: "balance", label: "Balance (future dollars)", color: "rgb(var(--chart-1))" },
                { key: "real", label: "Balance (today's dollars)", color: "rgb(var(--chart-2))" },
              ]}
            />
            <ScheduleTable
              title="Year-by-year projection"
              rows={result.rows}
              rowKey={(r) => `${r.age}-${r.phase}`}
              columns={[
                { header: "Age", cell: (r) => formatNumber(r.age, 1), align: "left" },
                {
                  header: "Phase",
                  cell: (r) => (r.phase === "saving" ? "Saving" : "Retired"),
                  align: "left",
                },
                {
                  header: "Contributions",
                  cell: (r) => formatCurrency(r.contributions, { cents: false }),
                },
                {
                  header: "Withdrawals",
                  cell: (r) => formatCurrency(r.withdrawals, { cents: false }),
                },
                { header: "Growth", cell: (r) => formatCurrency(r.growth, { cents: false }) },
                { header: "Balance", cell: (r) => formatCurrency(r.balance, { cents: false }) },
                {
                  header: "Today's dollars",
                  cell: (r) => formatCurrency(r.realBalance, { cents: false }),
                },
              ]}
              actions={
                <ExportButton
                  filename="retirement-projection"
                  rows={result.rows}
                  columns={[
                    { header: "Age", value: (r) => r.age },
                    { header: "Phase", value: (r) => r.phase },
                    { header: "Contributions", value: (r) => r.contributions },
                    { header: "Withdrawals", value: (r) => r.withdrawals },
                    { header: "Growth", value: (r) => r.growth },
                    { header: "Balance", value: (r) => r.balance },
                    { header: "Balance (today's dollars)", value: (r) => r.realBalance },
                  ]}
                />
              }
            />
          </>
        )
      }
    />
  );
}
