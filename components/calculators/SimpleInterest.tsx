"use client";

import { z } from "zod";
import { define } from "@/lib/glossary";
import { simpleInterest, type SimpleInterestResult } from "@/lib/finance";
import { money, numberText, percent } from "@/lib/schema";
import { formatCurrency, formatNumber } from "@/lib/format";
import { pctPhrase } from "@/lib/text";
import { useCalculator } from "@/components/calculator/useCalculator";
import { CalculatorPanels, InputGroup } from "@/components/calculator/CalculatorPanels";
import { ResultSummary } from "@/components/calculator/ResultSummary";
import { CopyResultsButton, ShareButton } from "@/components/calculator/ActionButtons";
import {
  MoneyField,
  NumberField,
  PercentField,
  SelectField,
  ToggleField,
} from "@/components/ui/FormFields";
import { BreakdownDonut } from "@/components/charts";

const schema = z
  .object({
    principal: money(),
    rate: percent(),
    time: numberText({ min: 0 }),
    unit: z.enum(["days", "months", "years"]),
    basis: z.enum(["365", "360"]).transform((v) => (v === "360" ? 360 : 365) as 360 | 365),
  })
  .superRefine((v, ctx) => {
    const maxByUnit = { days: 36_500, months: 1_200, years: 100 } as const;
    if (v.time > maxByUnit[v.unit]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["time"],
        message: "Terms are capped at 100 years",
      });
    }
  });

type Form = z.input<typeof schema>;
type Inputs = z.output<typeof schema>;

const defaults: Form = { principal: "1,000", rate: "5", time: "3", unit: "years", basis: "365" };

const compute = (v: Inputs): SimpleInterestResult => simpleInterest(v);

function summaryText(v: Inputs, r: SimpleInterestResult): string {
  const unit = v.time === 1 ? v.unit.slice(0, -1) : v.unit;
  return `Borrowing or lending ${formatCurrency(v.principal)} at ${pctPhrase(v.rate)} simple interest for ${formatNumber(v.time)} ${unit} earns ${formatCurrency(r.interest)} in interest, for a total of ${formatCurrency(r.total)}. Interest is charged only on the original amount — it never compounds.`;
}

export default function SimpleInterest() {
  const { form, result, inputs, isStale, getShareUrl } = useCalculator(schema, defaults, compute);

  return (
    <CalculatorPanels
      form={form}
      isStale={isStale}
      inputs={
        <InputGroup>
          <MoneyField name="principal" label="Principal" tooltip={define("principal")} />
          <PercentField
            name="rate"
            label="Annual interest rate"
            slider={{ min: 0, max: 30, step: 0.1 }}
            tooltip="The yearly interest rate, as a percentage. Type 5 for 5%."
            hint="You'll find it on your loan or savings agreement."
          />
          <NumberField
            name="time"
            label="Time"
            tooltip="How long the money is borrowed or saved. Pick days, months or years below."
          />
          <ToggleField
            name="unit"
            label="Time unit"
            options={[
              { value: "days", label: "Days" },
              { value: "months", label: "Months" },
              { value: "years", label: "Years" },
            ]}
          />
          {form.watch("unit") === "days" && (
            <SelectField
              name="basis"
              label="Day-count basis"
              options={[
                { value: "365", label: "365 days (actual/365)" },
                { value: "360", label: "360 days (banker's year)" },
              ]}
              tooltip={`${define("dayCount")} If you're not sure, use 365.`}
            />
          )}
        </InputGroup>
      }
      results={
        result &&
        inputs && (
          <>
            <ResultSummary
              headlineLabel="Interest"
              headline={formatCurrency(result.interest)}
              summary={summaryText(inputs, result)}
              stats={[
                { label: "Total (principal + interest)", value: formatCurrency(result.total) },
                { label: "Time in years", value: `${formatNumber(result.years, 4)} years` },
                {
                  label: "Interest per year",
                  value: formatCurrency(inputs.principal * inputs.rate),
                },
              ]}
              actions={
                <>
                  <ShareButton getUrl={getShareUrl} />
                  <CopyResultsButton
                    getText={() =>
                      [
                        `Simple interest: ${formatCurrency(result.interest)}`,
                        `Total: ${formatCurrency(result.total)}`,
                        summaryText(inputs, result),
                        getShareUrl(),
                      ].join("\n")
                    }
                  />
                </>
              }
            />
            <BreakdownDonut
              title="What you pay back"
              centerLabel="Total"
              centerValue={formatCurrency(result.total, { cents: false })}
              slices={[
                {
                  key: "principal",
                  label: "Principal",
                  value: inputs.principal,
                  color: "rgb(var(--chart-1))",
                },
                {
                  key: "interest",
                  label: "Interest",
                  value: result.interest,
                  color: "rgb(var(--chart-3))",
                },
              ]}
            />
          </>
        )
      }
    />
  );
}
