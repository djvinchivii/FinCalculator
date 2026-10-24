"use client";

import { z } from "zod";
import {
  COMPOUNDING_OPTIONS,
  FREQUENCY_OPTIONS,
  monthsBetween,
  parseISODate,
  simulateCompound,
  solveContribution,
  solveTime,
  type CompoundResult,
  type SolveContributionResult,
  type SolveTimeResult,
} from "@/lib/finance";
import { compounding, frequency, money, numberText, percent, timing, toOptions } from "@/lib/schema";
import { formatCurrency, formatDuration, formatMonthYear } from "@/lib/format";
import { perPeriod, periodNoun, pctPhrase } from "@/lib/text";
import { useCalculator } from "@/components/calculator/useCalculator";
import { CalculatorPanels, InputGroup } from "@/components/calculator/CalculatorPanels";
import { Alert, ResultSummary } from "@/components/calculator/ResultSummary";
import { ScheduleTable } from "@/components/calculator/ScheduleTable";
import { CopyResultsButton, ExportButton, ShareButton } from "@/components/calculator/ActionButtons";
import { DateField, MoneyField, NumberField, PercentField, SelectField, ToggleField } from "@/components/ui/FormFields";
import { Tabs } from "@/components/ui/Tabs";
import { GrowthChart } from "@/components/charts";
import { localTodayISO } from "./loan-shared";

const schema = z
  .object({
    mode: z.enum(["contribution", "time"]),
    target: money({ exclusiveMin: true, min: 0, minMessage: "Enter a goal above $0" }),
    current: money({ optional: true }),
    annualRate: percent(),
    compounding: compounding(),
    contributionFrequency: frequency(),
    timing: timing(),
    deadlineMode: z.enum(["years", "date"]),
    years: numberText({ optional: true, min: 0, max: 100, maxMessage: "Deadlines are capped at 100 years" }),
    deadline: z.string(),
    contribution: money({ optional: true }),
  })
  .superRefine((v, ctx) => {
    if (v.mode === "contribution") {
      if (v.deadlineMode === "years" && v.years <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["years"], message: "Enter how many years you have" });
      }
      if (v.deadlineMode === "date") {
        const d = parseISODate(v.deadline);
        const today = parseISODate(localTodayISO());
        if (!d || !today) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deadline"], message: "Pick a deadline date" });
        else if (monthsBetween(today, d) < 1) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deadline"], message: "Pick a date at least a month away" });
        else if (monthsBetween(today, d) > 1200) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deadline"], message: "Deadlines are capped at 100 years" });
      }
    }
  });

type Form = z.input<typeof schema>;
type Inputs = z.output<typeof schema>;

const defaults: Form = {
  mode: "contribution",
  target: "25,000",
  current: "2,000",
  annualRate: "4.5",
  compounding: "12",
  contributionFrequency: "12",
  timing: "end",
  deadlineMode: "years",
  years: "3",
  deadline: "",
  contribution: "500",
};

type Computed =
  | { mode: "contribution"; years: number; solved: SolveContributionResult; projection: CompoundResult }
  | { mode: "time"; solved: SolveTimeResult; projection: CompoundResult | null };

function deadlineYears(v: Inputs): number {
  if (v.deadlineMode === "years") return v.years;
  const d = parseISODate(v.deadline);
  const today = parseISODate(localTodayISO());
  return d && today ? monthsBetween(today, d) / 12 : 0;
}

const compute = (v: Inputs): Computed => {
  const base = { target: v.target, current: v.current, annualRate: v.annualRate, compounding: v.compounding, contributionFrequency: v.contributionFrequency, timing: v.timing };
  if (v.mode === "contribution") {
    const years = deadlineYears(v);
    const solved = solveContribution({ ...base, years });
    const projection = simulateCompound({ principal: v.current, contribution: solved.contribution, contributionFrequency: v.contributionFrequency, timing: v.timing, annualRate: v.annualRate, compounding: v.compounding, years: solved.periods / v.contributionFrequency });
    return { mode: "contribution", years, solved, projection };
  }
  const solved = solveTime({ ...base, contribution: v.contribution });
  const projection =
    solved.reachable && solved.periodsWhole !== null && solved.periodsWhole > 0
      ? simulateCompound({ principal: v.current, contribution: v.contribution, contributionFrequency: v.contributionFrequency, timing: v.timing, annualRate: v.annualRate, compounding: v.compounding, years: solved.periodsWhole / v.contributionFrequency })
      : null;
  return { mode: "time", solved, projection };
};

function reachDate(months: number | null): string | null {
  if (months === null) return null;
  const d = new Date();
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth() + Math.round(months), 1));
  return target.toISOString().slice(0, 10);
}

function summaryText(v: Inputs, c: Computed): string {
  if (c.mode === "contribution") {
    if (c.solved.alreadyOnTrack) return `Good news: your ${formatCurrency(v.current, { cents: false })} growing at ${pctPhrase(v.annualRate)} reaches ${formatCurrency(v.target, { cents: false })} on its own — no extra contributions needed.`;
    return `To turn ${formatCurrency(v.current, { cents: false })} into ${formatCurrency(v.target, { cents: false })} in ${formatDuration(c.years * 12)} at ${pctPhrase(v.annualRate)}, save ${formatCurrency(c.solved.contributionRounded)} ${perPeriod(v.contributionFrequency)}. You'll contribute ${formatCurrency(c.solved.totalContributed, { cents: false })} in total and interest covers the other ${formatCurrency(c.solved.interestEarned, { cents: false })}.`;
  }
  if (!c.solved.reachable || c.solved.months === null) return `With ${formatCurrency(v.contribution)} ${perPeriod(v.contributionFrequency)} and no growth, you'll never reach ${formatCurrency(v.target, { cents: false })}. Add a contribution or an interest rate.`;
  if (c.solved.months === 0) return `You've already reached your ${formatCurrency(v.target, { cents: false })} goal. 🎉`;
  return `Saving ${formatCurrency(v.contribution)} ${perPeriod(v.contributionFrequency)} on top of ${formatCurrency(v.current, { cents: false })} at ${pctPhrase(v.annualRate)}, you'll reach ${formatCurrency(v.target, { cents: false })} in about ${formatDuration(c.solved.months)}.`;
}

export default function SavingsGoal() {
  const { form, result, inputs, isStale, getShareUrl } = useCalculator(schema, defaults, compute);
  const mode = form.watch("mode");
  const deadlineMode = form.watch("deadlineMode");
  const freq = Number(form.watch("contributionFrequency"));

  let headlineLabel = "";
  let headline = "";
  if (result && inputs) {
    if (result.mode === "contribution") {
      headlineLabel = `Save each ${periodNoun(inputs.contributionFrequency)}`;
      headline = formatCurrency(result.solved.contributionRounded);
    } else {
      headlineLabel = "Time to reach your goal";
      headline = result.solved.reachable && result.solved.months !== null ? formatDuration(result.solved.months) : "Never at this rate";
    }
  }
  const projection = result?.projection ?? null;

  return (
    <CalculatorPanels
      form={form}
      isStale={isStale}
      inputs={
        <>
          <Tabs
            label="What do you want to solve for?"
            idPrefix="goal-mode"
            value={mode}
            onChange={(v) => form.setValue("mode", v as Form["mode"], { shouldValidate: true, shouldDirty: true })}
            options={[
              { value: "contribution", label: "How much to save" },
              { value: "time", label: "How long it takes" },
            ]}
          />
          <div id="goal-mode-panel" role="tabpanel" aria-labelledby={`goal-mode-tab-${mode}`} className="space-y-5">
            <InputGroup title="Goal">
              <MoneyField name="target" label="Savings goal" tooltip="The amount you want to have saved." />
              <MoneyField name="current" label="Current savings" tooltip="What you've already set aside for this goal." />
            </InputGroup>
            {mode === "contribution" ? (
              <InputGroup title="Deadline">
                <ToggleField
                  name="deadlineMode"
                  label="Set deadline by"
                  options={[
                    { value: "years", label: "Years from now" },
                    { value: "date", label: "Date" },
                  ]}
                />
                {deadlineMode === "years" ? (
                  <NumberField name="years" label="Years to goal" suffix="years" slider={{ min: 1, max: 40 }} tooltip="How long until you need the money." />
                ) : (
                  <DateField name="deadline" label="Goal date" tooltip="The date you need the money by." />
                )}
              </InputGroup>
            ) : (
              <InputGroup title="Contribution">
                <MoneyField name="contribution" label={`Contribution each ${periodNoun(freq)}`} tooltip="The fixed amount you'll add every period." />
              </InputGroup>
            )}
            <InputGroup title="Growth">
              <PercentField name="annualRate" label="Annual interest rate" slider={{ min: 0, max: 12, step: 0.1 }} tooltip="The yearly rate your savings earn (e.g. a high-yield savings account's APR)." />
              <SelectField name="compounding" label="Compounding" options={toOptions(COMPOUNDING_OPTIONS)} tooltip="How often interest is added to your balance." />
              <SelectField name="contributionFrequency" label="Contribution frequency" options={toOptions(FREQUENCY_OPTIONS)} tooltip="How often you add money." />
              <ToggleField
                name="timing"
                label="Contribution timing"
                options={[
                  { value: "end", label: "End of period" },
                  { value: "begin", label: "Beginning" },
                ]}
                tooltip="Saving at the start of each period gives your money one extra period to grow."
              />
            </InputGroup>
          </div>
        </>
      }
      results={
        result &&
        inputs && (
          <>
            <ResultSummary
              headlineLabel={headlineLabel}
              headline={headline}
              summary={summaryText(inputs, result)}
              stats={
                result.mode === "contribution"
                  ? [
                      { label: "Total you contribute", value: formatCurrency(result.solved.totalContributed) },
                      { label: "Interest earned", value: formatCurrency(result.solved.interestEarned), tone: "good" },
                      { label: "Number of deposits", value: String(result.solved.alreadyOnTrack ? 0 : result.solved.periods) },
                    ]
                  : result.solved.reachable && result.projection
                    ? [
                        { label: "Goal reached", value: formatMonthYear(reachDate(result.solved.months)) },
                        { label: "Total you contribute", value: formatCurrency(result.projection.totalContributed) },
                        { label: "Interest earned", value: formatCurrency(result.projection.totalInterest), tone: "good" },
                      ]
                    : []
              }
              actions={
                <>
                  <ShareButton getUrl={getShareUrl} />
                  <CopyResultsButton getText={() => [`Savings goal — ${headlineLabel}: ${headline}`, summaryText(inputs, result), getShareUrl()].join("\n")} />
                </>
              }
            />
            {result.mode === "time" && !result.solved.reachable && <Alert tone="danger">This goal can’t be reached without contributions or interest. Increase your contribution or rate.</Alert>}
            {projection && projection.years.length > 0 && (
              <>
                <GrowthChart
                  title="Path to your goal"
                  xKey="year"
                  xLabel="Year"
                  data={[
                    { year: 0, contributed: inputs.current, interest: 0 },
                    ...projection.years.map((y) => ({ year: y.year, contributed: y.totalContributed, interest: y.totalInterest })),
                  ]}
                  series={[
                    { key: "contributed", label: "Your deposits", color: "rgb(var(--chart-1))" },
                    { key: "interest", label: "Interest", color: "rgb(var(--chart-2))" },
                  ]}
                />
                <ScheduleTable
                  title="Year-by-year progress"
                  defaultOpen={projection.years.length <= 20}
                  rows={projection.years}
                  rowKey={(r) => r.year}
                  columns={[
                    { header: "Year", cell: (r) => r.year, align: "left" },
                    { header: "Deposits", cell: (r) => formatCurrency(r.contributions) },
                    { header: "Interest", cell: (r) => formatCurrency(r.interest) },
                    { header: "Balance", cell: (r) => formatCurrency(r.balance) },
                    { header: "% of goal", cell: (r) => `${Math.min(999, Math.round((r.balance / inputs.target) * 100))}%` },
                  ]}
                  actions={
                    <ExportButton
                      filename="savings-goal-progress"
                      rows={projection.years}
                      columns={[
                        { header: "Year", value: (r) => r.year },
                        { header: "Deposits", value: (r) => r.contributions },
                        { header: "Interest", value: (r) => r.interest },
                        { header: "Balance", value: (r) => r.balance },
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
