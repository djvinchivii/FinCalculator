"use client";

import { z } from "zod";
import {
  budgetSplit,
  emergencyFund,
  type BudgetSplitResult,
  type EmergencyFundResult,
} from "@/lib/finance";
import { money, numberText } from "@/lib/schema";
import { formatCurrency, formatDuration, formatNumber } from "@/lib/format";
import { useCalculator } from "@/components/calculator/useCalculator";
import { CalculatorPanels, InputGroup } from "@/components/calculator/CalculatorPanels";
import { ResultSummary } from "@/components/calculator/ResultSummary";
import { CopyResultsButton, ShareButton } from "@/components/calculator/ActionButtons";
import { MoneyField, NumberField, PercentField } from "@/components/ui/FormFields";
import { BreakdownDonut } from "@/components/charts";

const pct = () => numberText({ min: 0, max: 100, maxMessage: "Must be 100% or less" });

const schema = z
  .object({
    income: money(),
    needs: pct(),
    wants: pct(),
    savings: pct(),
    monthlyExpenses: money(),
    months: numberText({
      min: 3,
      max: 12,
      integer: true,
      minMessage: "Choose 3 to 12 months",
      maxMessage: "Choose 3 to 12 months",
    }),
    currentSaved: money({ optional: true }),
    monthlySaving: money({ optional: true }),
  })
  .superRefine((v, ctx) => {
    const total = v.needs + v.wants + v.savings;
    if (Math.abs(total - 100) > 1e-9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["savings"],
        message: `Needs + wants + savings must total 100% (now ${formatNumber(total)}%)`,
      });
    }
  });

type Form = z.input<typeof schema>;
type Inputs = z.output<typeof schema>;

const defaults: Form = {
  income: "5,000",
  needs: "50",
  wants: "30",
  savings: "20",
  monthlyExpenses: "3,000",
  months: "6",
  currentSaved: "2,000",
  monthlySaving: "",
};

interface Computed {
  split: BudgetSplitResult;
  fund: EmergencyFundResult;
  savingRate: number;
}

const compute = (v: Inputs): Computed => {
  const split = budgetSplit({
    monthlyIncome: v.income,
    needs: v.needs / 100,
    wants: v.wants / 100,
    savings: v.savings / 100,
  });
  const savingRate = v.monthlySaving > 0 ? v.monthlySaving : split.savings;
  return {
    split,
    savingRate,
    fund: emergencyFund({
      monthlyExpenses: v.monthlyExpenses,
      months: v.months,
      currentSavings: v.currentSaved,
      monthlySaving: savingRate,
    }),
  };
};

function fundText(v: Inputs, c: Computed): string {
  const target = `A ${v.months}-month emergency fund for ${formatCurrency(v.monthlyExpenses, { cents: false })} of monthly expenses is ${formatCurrency(c.fund.target, { cents: false })}.`;
  if (c.fund.monthsToGoal === 0) return `${target} You've already got it covered. 🎉`;
  if (c.fund.monthsToGoal === null)
    return `${target} Set aside some money each month to start building it.`;
  return `${target} You need ${formatCurrency(c.fund.remaining, { cents: false })} more; saving ${formatCurrency(c.savingRate, { cents: false })} a month gets you there in ${formatDuration(c.fund.monthsToGoal)}.`;
}

export default function Budget() {
  const { form, result, inputs, isStale, getShareUrl } = useCalculator(schema, defaults, compute);

  return (
    <CalculatorPanels
      form={form}
      isStale={isStale}
      inputs={
        <>
          <InputGroup title="50/30/20 budget">
            <MoneyField
              name="income"
              label="Monthly take-home pay"
              tooltip="Your pay after taxes and deductions — what actually lands in your bank account."
            />
            <div className="grid grid-cols-3 gap-2">
              <PercentField
                name="needs"
                label="Needs"
                tooltip="Essentials you must pay: housing, utilities, groceries, insurance, minimum debt payments."
              />
              <PercentField
                name="wants"
                label="Wants"
                tooltip="Nice-to-haves: dining out, streaming, travel, hobbies."
              />
              <PercentField
                name="savings"
                label="Savings"
                tooltip="Saving, investing and paying down debt beyond the minimums."
              />
            </div>
          </InputGroup>
          <InputGroup title="Emergency fund">
            <MoneyField
              name="monthlyExpenses"
              label="Essential monthly expenses"
              tooltip="What you'd need each month to cover the basics if your income stopped."
            />
            <NumberField
              name="months"
              label="Months of expenses to cover"
              grouping={false}
              allowDecimal={false}
              slider={{ min: 3, max: 12 }}
              tooltip="Most experts suggest 3–6 months; aim higher if your income is irregular."
            />
            <MoneyField name="currentSaved" label="Already saved" />
            <MoneyField
              name="monthlySaving"
              label="Monthly saving toward it"
              hint="Leave blank to use your savings bucket from the budget."
              tooltip="How much you'll set aside each month for the emergency fund."
            />
          </InputGroup>
        </>
      }
      results={
        result &&
        inputs && (
          <>
            <ResultSummary
              headlineLabel="Your monthly budget"
              headline={`${formatCurrency(result.split.needs, { cents: false })} / ${formatCurrency(result.split.wants, { cents: false })} / ${formatCurrency(result.split.savings, { cents: false })}`}
              summary={`Out of ${formatCurrency(inputs.income, { cents: false })} a month, a ${formatNumber(inputs.needs)}/${formatNumber(inputs.wants)}/${formatNumber(inputs.savings)} split means up to ${formatCurrency(result.split.needs, { cents: false })} for needs, ${formatCurrency(result.split.wants, { cents: false })} for wants, and at least ${formatCurrency(result.split.savings, { cents: false })} toward savings and extra debt payments.`}
              stats={[
                {
                  label: `Needs (${formatNumber(inputs.needs)}%)`,
                  value: formatCurrency(result.split.needs),
                },
                {
                  label: `Wants (${formatNumber(inputs.wants)}%)`,
                  value: formatCurrency(result.split.wants),
                },
                {
                  label: `Savings (${formatNumber(inputs.savings)}%)`,
                  value: formatCurrency(result.split.savings),
                  tone: "good",
                },
              ]}
              actions={
                <>
                  <ShareButton getUrl={getShareUrl} />
                  <CopyResultsButton
                    getText={() =>
                      [
                        `Budget on ${formatCurrency(inputs.income)}/mo:`,
                        `  Needs: ${formatCurrency(result.split.needs)}`,
                        `  Wants: ${formatCurrency(result.split.wants)}`,
                        `  Savings: ${formatCurrency(result.split.savings)}`,
                        `Emergency fund target: ${formatCurrency(result.fund.target)}`,
                        fundText(inputs, result),
                        getShareUrl(),
                      ].join("\n")
                    }
                  />
                </>
              }
            />
            <BreakdownDonut
              title="Where each paycheck goes"
              centerLabel="Take-home"
              centerValue={formatCurrency(inputs.income, { cents: false })}
              slices={[
                {
                  key: "needs",
                  label: "Needs",
                  value: result.split.needs,
                  color: "rgb(var(--chart-1))",
                },
                {
                  key: "wants",
                  label: "Wants",
                  value: result.split.wants,
                  color: "rgb(var(--chart-3))",
                },
                {
                  key: "savings",
                  label: "Savings",
                  value: result.split.savings,
                  color: "rgb(var(--chart-2))",
                },
              ]}
            />
            <ResultSummary
              testId="headline-emergency"
              headlineLabel="Emergency fund target"
              headline={formatCurrency(result.fund.target, { cents: false })}
              summary={fundText(inputs, result)}
              stats={[
                { label: "Still to save", value: formatCurrency(result.fund.remaining) },
                {
                  label: "Time to goal",
                  value:
                    result.fund.monthsToGoal === null
                      ? "Not yet — add savings"
                      : result.fund.monthsToGoal === 0
                        ? "Done!"
                        : formatDuration(result.fund.monthsToGoal),
                  tone: result.fund.monthsToGoal === 0 ? "good" : "default",
                },
                {
                  label: "Funded so far",
                  value:
                    result.fund.target > 0
                      ? `${Math.min(100, Math.round((inputs.currentSaved / result.fund.target) * 100))}%`
                      : "—",
                },
              ]}
            />
          </>
        )
      }
    />
  );
}
