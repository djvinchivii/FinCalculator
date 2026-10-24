"use client";

import { z } from "zod";
import { define } from "@/lib/glossary";
import {
  COMPOUNDING_OPTIONS,
  FREQUENCY_OPTIONS,
  simulateCompound,
  type CompoundResult,
} from "@/lib/finance";
import { compounding, frequency, money, percent, timing, toOptions, years } from "@/lib/schema";
import { formatCurrency, formatPercent } from "@/lib/format";
import { perPeriod, pctPhrase, yearsPhrase } from "@/lib/text";
import { useCalculator } from "@/components/calculator/useCalculator";
import { CalculatorPanels, InputGroup } from "@/components/calculator/CalculatorPanels";
import { ResultSummary } from "@/components/calculator/ResultSummary";
import { ScheduleTable } from "@/components/calculator/ScheduleTable";
import {
  CopyResultsButton,
  ExportButton,
  ShareButton,
} from "@/components/calculator/ActionButtons";
import {
  MoneyField,
  NumberField,
  PercentField,
  SelectField,
  ToggleField,
} from "@/components/ui/FormFields";
import { GrowthChart } from "@/components/charts";

const schema = z.object({
  principal: money(),
  contribution: money({ optional: true }),
  contributionFrequency: frequency(),
  timing: timing(),
  annualRate: percent(),
  compounding: compounding(),
  years: years(),
  contributionGrowth: percent({
    optional: true,
    maxMessage: "Increases are capped at 100% a year",
  }),
  inflation: percent({ optional: true }),
});

type Form = z.input<typeof schema>;
type Inputs = z.output<typeof schema>;

const defaults: Form = {
  principal: "10,000",
  contribution: "500",
  contributionFrequency: "12",
  timing: "end",
  annualRate: "7",
  compounding: "12",
  years: "30",
  contributionGrowth: "",
  inflation: "",
};

const compute = (v: Inputs): CompoundResult => simulateCompound(v);

function summaryText(v: Inputs, r: CompoundResult): string {
  const adds =
    v.contribution > 0
      ? ` and add ${formatCurrency(v.contribution, { cents: false })} ${perPeriod(v.contributionFrequency)}`
      : "";
  const growth =
    v.contribution > 0 && (v.contributionGrowth ?? 0) > 0
      ? ` (raising it ${pctPhrase(v.contributionGrowth)} each year)`
      : "";
  return `If you invest ${formatCurrency(v.principal, { cents: false })}${adds}${growth} at ${pctPhrase(v.annualRate)} for ${yearsPhrase(v.years)}, you'll have about ${formatCurrency(r.futureBalance, { cents: false })}. You put in ${formatCurrency(r.totalContributed, { cents: false })} — the other ${formatCurrency(r.totalInterest, { cents: false })} is interest working for you.`;
}

export default function CompoundInterest() {
  const { form, result, inputs, isStale, getShareUrl } = useCalculator(schema, defaults, compute);
  const hasInflation = (inputs?.inflation ?? 0) > 0;

  return (
    <CalculatorPanels
      form={form}
      isStale={isStale}
      inputs={
        <>
          <InputGroup title="Money in">
            <MoneyField
              name="principal"
              label="Initial deposit"
              tooltip="The money you're starting with today. Use 0 if you're starting from scratch."
            />
            <MoneyField
              name="contribution"
              label="Recurring contribution"
              tooltip="How much you'll add on a regular schedule, like $100 every month. Leave blank if you won't add any."
            />
            <SelectField
              name="contributionFrequency"
              label="Contribution frequency"
              options={toOptions(FREQUENCY_OPTIONS)}
              tooltip="How often you add money — for example monthly, or every paycheck (bi-weekly)."
            />
            <ToggleField
              name="timing"
              label="Contribution timing"
              options={[
                { value: "end", label: "End of period" },
                { value: "begin", label: "Beginning" },
              ]}
              tooltip={define("contributionTiming")}
            />
          </InputGroup>
          <InputGroup title="Growth">
            <PercentField
              name="annualRate"
              label="Annual interest rate"
              slider={{ min: 0, max: 15, step: 0.1 }}
              tooltip="How much your money grows each year, as a percentage. Type 7 for 7%."
              hint="Not sure? Savings accounts pay about 0–5%. Stock index funds have averaged about 7–10% a year over the long run — but that's not guaranteed."
            />
            <SelectField
              name="compounding"
              label="Compounding frequency"
              options={toOptions(COMPOUNDING_OPTIONS)}
              tooltip={`${define("compoundingFrequency")} If you're not sure, choose Monthly.`}
            />
            <NumberField
              name="years"
              label="Years"
              suffix="years"
              slider={{ min: 1, max: 50 }}
              tooltip="How many years you'll leave the money to grow."
            />
          </InputGroup>
          <InputGroup title="Optional">
            <PercentField
              name="contributionGrowth"
              label="Annual contribution increase"
              tooltip="Optional. If you'll save a bit more each year (say, when you get a raise), enter by how much — 3 means 3% more each year."
            />
            <PercentField
              name="inflation"
              label="Inflation rate"
              tooltip="Optional. Prices rise over time, so future money buys less. Enter a rate (about 3% is typical) to see your balance in today's dollars."
            />
          </InputGroup>
        </>
      }
      results={
        result &&
        inputs && (
          <>
            <ResultSummary
              headlineLabel="Future balance"
              headline={formatCurrency(result.futureBalance)}
              summary={summaryText(inputs, result)}
              stats={[
                { label: "Total contributed", value: formatCurrency(result.totalContributed) },
                {
                  label: "Total interest earned",
                  value: formatCurrency(result.totalInterest),
                  tone: "good",
                },
                hasInflation
                  ? {
                      label: "In today's dollars",
                      value: formatCurrency(result.realBalance),
                      hint: `at ${formatPercent(inputs.inflation)} inflation`,
                    }
                  : {
                      label: "Interest share of balance",
                      value:
                        result.futureBalance > 0
                          ? formatPercent(result.totalInterest / result.futureBalance, 1)
                          : "—",
                    },
              ]}
              actions={
                <>
                  <ShareButton getUrl={getShareUrl} />
                  <CopyResultsButton
                    getText={() =>
                      [
                        `Compound interest — future balance: ${formatCurrency(result.futureBalance)}`,
                        `Total contributed: ${formatCurrency(result.totalContributed)}`,
                        `Total interest: ${formatCurrency(result.totalInterest)}`,
                        hasInflation
                          ? `In today's dollars: ${formatCurrency(result.realBalance)}`
                          : "",
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
            {result.years.length > 0 && (
              <GrowthChart
                title="Contributions vs. interest over time"
                xKey="year"
                xLabel="Year"
                data={[
                  { year: 0, contributed: inputs.principal, interest: 0 },
                  ...result.years.map((y) => ({
                    year: y.year,
                    contributed: y.totalContributed,
                    interest: y.totalInterest,
                  })),
                ]}
                series={[
                  { key: "contributed", label: "Your contributions", color: "rgb(var(--chart-1))" },
                  { key: "interest", label: "Interest earned", color: "rgb(var(--chart-2))" },
                ]}
              />
            )}
            <ScheduleTable
              title="Year-by-year breakdown"
              defaultOpen={result.years.length <= 50}
              rows={result.years}
              rowKey={(r) => r.year}
              columns={[
                { header: "Year", cell: (r) => r.year, align: "left" },
                { header: "Contributions", cell: (r) => formatCurrency(r.contributions) },
                { header: "Interest", cell: (r) => formatCurrency(r.interest) },
                { header: "Total contributed", cell: (r) => formatCurrency(r.totalContributed) },
                { header: "Total interest", cell: (r) => formatCurrency(r.totalInterest) },
                { header: "Balance", cell: (r) => formatCurrency(r.balance) },
                ...(hasInflation
                  ? [
                      {
                        header: "Today's dollars",
                        cell: (r: CompoundResult["years"][number]) => formatCurrency(r.realBalance),
                      },
                    ]
                  : []),
              ]}
              actions={
                <ExportButton
                  filename="compound-interest-schedule"
                  rows={result.years}
                  columns={[
                    { header: "Year", value: (r) => r.year },
                    { header: "Contributions", value: (r) => r.contributions },
                    { header: "Interest", value: (r) => r.interest },
                    { header: "Total contributed", value: (r) => r.totalContributed },
                    { header: "Total interest", value: (r) => r.totalInterest },
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
