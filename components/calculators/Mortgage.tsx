"use client";

import { z } from "zod";
import { define } from "@/lib/glossary";
import { mortgage, type MortgageResult } from "@/lib/finance";
import { isoDate, money, numberText, percent } from "@/lib/schema";
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatMonthYear,
  formatPercent,
} from "@/lib/format";
import { pctPhrase } from "@/lib/text";
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
  NumberField,
  PercentField,
  ToggleField,
} from "@/components/ui/FormFields";
import { AmortizationChart, BreakdownDonut } from "@/components/charts";
import { localTodayISO, yearlyAmortization } from "./loan-shared";

const schema = z
  .object({
    homePrice: money({ exclusiveMin: true, min: 0, minMessage: "Enter a home price above $0" }),
    downMode: z.enum(["percent", "amount"]),
    downPayment: numberText({ min: 0 }),
    annualRate: percent(),
    termYears: numberText({
      min: 1,
      max: 50,
      integer: true,
      maxMessage: "Mortgage terms are capped at 50 years",
    }),
    taxMode: z.enum(["percent", "amount"]),
    propertyTax: numberText({ min: 0, optional: true }),
    insuranceAnnual: money({ optional: true }),
    hoaMonthly: money({ optional: true }),
    pmiRate: percent({ optional: true, max: 5, maxMessage: "PMI is usually 0.3%–1.5% — max 5%" }),
    startDate: isoDate(),
    extraPerPayment: money({ optional: true }),
  })
  .superRefine((v, ctx) => {
    if (v.downMode === "percent" && v.downPayment > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["downPayment"],
        message: "Down payment can’t exceed 100%",
      });
    }
    if (v.downMode === "amount" && v.downPayment > v.homePrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["downPayment"],
        message: "Down payment can’t exceed the home price",
      });
    }
    if (v.taxMode === "percent" && v.propertyTax > 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["propertyTax"],
        message: "Property tax rates are capped at 20%",
      });
    }
  });

type Form = z.input<typeof schema>;
type Inputs = z.output<typeof schema>;

const defaults: Form = {
  homePrice: "400,000",
  downMode: "percent",
  downPayment: "10",
  annualRate: "6.5",
  termYears: "30",
  taxMode: "percent",
  propertyTax: "1.2",
  insuranceAnnual: "1,500",
  hoaMonthly: "0",
  pmiRate: "0.5",
  startDate: "2026-01-01",
  extraPerPayment: "",
};

const clientDefaults = (): Partial<Form> => ({ startDate: localTodayISO() });

const compute = (v: Inputs): MortgageResult =>
  mortgage({
    homePrice: v.homePrice,
    downPayment: {
      mode: v.downMode,
      value: v.downMode === "percent" ? v.downPayment / 100 : v.downPayment,
    },
    annualRate: v.annualRate,
    termYears: v.termYears,
    propertyTax: {
      mode: v.taxMode,
      value: v.taxMode === "percent" ? v.propertyTax / 100 : v.propertyTax,
    },
    insuranceAnnual: v.insuranceAnnual,
    hoaMonthly: v.hoaMonthly,
    pmiRate: v.pmiRate,
    startDate: v.startDate,
    extras: { perPayment: v.extraPerPayment },
  });

function summaryText(v: Inputs, r: MortgageResult): string {
  const pmi = r.pmiRequired
    ? ` Because you're putting down less than 20%, you'll pay PMI of ${formatCurrency(r.monthly.pmi)} a month until about ${formatMonthYear(r.pmiDropOffDate)}.`
    : "";
  return `For a ${formatCurrency(v.homePrice, { cents: false })} home with ${formatCurrency(r.downPaymentAmount, { cents: false })} down at ${pctPhrase(v.annualRate)}, your all-in monthly payment is about ${formatCurrency(r.monthly.total, { cents: false })}, of which ${formatCurrency(r.monthly.principalAndInterest, { cents: false })} is the loan itself.${pmi} Over ${v.termYears} years, owning this home costs about ${formatCurrency(r.totalCostOfOwnership, { cents: false })} including the down payment.`;
}

export default function Mortgage() {
  const { form, result, inputs, isStale, getShareUrl } = useCalculator(
    schema,
    defaults,
    compute,
    clientDefaults,
  );
  const downMode = form.watch("downMode");
  const taxMode = form.watch("taxMode");

  const stats: Stat[] = result
    ? [
        {
          label: "Loan amount",
          value: formatCurrency(result.loanAmount),
          hint: `${formatPercent(result.ltv, 1)} loan-to-value`,
        },
        { label: "Total interest", value: formatCurrency(result.loan.totalInterest), tone: "bad" },
        { label: "Payoff date", value: formatMonthYear(result.loan.payoffDate) },
        result.pmiRequired
          ? {
              label: "PMI drops off",
              value: formatMonthYear(result.pmiDropOffDate),
              hint: `after ${formatDuration(result.pmiMonths)} · ${formatCurrency(result.totalPmi, { cents: false })} total`,
            }
          : { label: "PMI", value: "Not required", hint: "20%+ down payment", tone: "good" },
        {
          label: "Total cost of ownership",
          value: formatCurrency(result.totalCostOfOwnership, { cents: false }),
          hint: "down payment + loan + tax, insurance, HOA, PMI",
        },
      ]
    : [];
  if (result?.loan.hasExtras) {
    stats.push({
      label: "Interest saved",
      value: formatCurrency(result.loan.interestSaved),
      tone: "good",
      hint: `${formatDuration(result.loan.paymentsSaved)} sooner`,
    });
  }

  return (
    <CalculatorPanels
      form={form}
      isStale={isStale}
      inputs={
        <>
          <InputGroup title="Home & loan">
            <MoneyField
              name="homePrice"
              label="Home price"
              tooltip="What you'll pay for the home."
            />
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <NumberField
                name="downPayment"
                label="Down payment"
                prefix={downMode === "amount" ? "$" : undefined}
                suffix={downMode === "percent" ? "%" : undefined}
                tooltip={`${define("downPayment")} Under 20% usually means paying PMI.`}
              />
              <ToggleField
                name="downMode"
                label="Down payment unit"
                options={[
                  { value: "percent", label: "%" },
                  { value: "amount", label: "$" },
                ]}
              />
            </div>
            <PercentField
              name="annualRate"
              label="Interest rate"
              slider={{ min: 0, max: 12, step: 0.05 }}
              tooltip="The mortgage's yearly interest rate. Type 6.5 for 6.5%."
              hint="Get a quote from a lender or check a mortgage-rate website."
            />
            <NumberField
              name="termYears"
              label="Loan term"
              suffix="years"
              grouping={false}
              allowDecimal={false}
              tooltip="How many years you'll take to pay off the home. 30 years is most common; 15 years means bigger payments but far less interest."
            />
            <DateField
              name="startDate"
              label="Loan start date"
              hint="Your first payment is due one month later."
            />
          </InputGroup>
          <InputGroup title="Costs on top of the loan">
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <NumberField
                name="propertyTax"
                label="Property tax (annual)"
                prefix={taxMode === "amount" ? "$" : undefined}
                suffix={taxMode === "percent" ? "%" : undefined}
                tooltip={`${define("propertyTax")} Enter it as a % of the price (often about 0.5%–2%) or as a yearly dollar amount.`}
              />
              <ToggleField
                name="taxMode"
                label="Property tax unit"
                options={[
                  { value: "percent", label: "%" },
                  { value: "amount", label: "$" },
                ]}
              />
            </div>
            <MoneyField
              name="insuranceAnnual"
              label="Homeowners insurance (annual)"
              tooltip={`${define("homeInsurance")} About $1,000–$3,000 a year is common.`}
            />
            <MoneyField
              name="hoaMonthly"
              label="HOA dues (monthly)"
              tooltip={`${define("hoa")} Use 0 if there isn't one.`}
            />
            <PercentField
              name="pmiRate"
              label="PMI rate (annual)"
              tooltip={`${define("pmi")} Usually about 0.3%–1.5% of the loan per year.`}
            />
          </InputGroup>
          <InputGroup title="Extra payments (optional)">
            <MoneyField
              name="extraPerPayment"
              label="Extra principal each month"
              tooltip="Paying a little extra each month toward what you owe saves interest, finishes the loan sooner and removes PMI earlier."
            />
          </InputGroup>
        </>
      }
      results={
        result &&
        inputs && (
          <>
            <ResultSummary
              headlineLabel="Total monthly payment"
              headline={formatCurrency(result.monthly.total)}
              summary={summaryText(inputs, result)}
              stats={stats}
              actions={
                <>
                  <ShareButton getUrl={getShareUrl} />
                  <CopyResultsButton
                    getText={() =>
                      [
                        `Total monthly payment: ${formatCurrency(result.monthly.total)}`,
                        `  Principal & interest: ${formatCurrency(result.monthly.principalAndInterest)}`,
                        `  Property tax: ${formatCurrency(result.monthly.tax)}`,
                        `  Insurance: ${formatCurrency(result.monthly.insurance)}`,
                        `  HOA: ${formatCurrency(result.monthly.hoa)}`,
                        `  PMI: ${formatCurrency(result.monthly.pmi)}`,
                        result.pmiRequired
                          ? `PMI drops off: ${formatMonthYear(result.pmiDropOffDate)}`
                          : "",
                        `Total cost of ownership: ${formatCurrency(result.totalCostOfOwnership)}`,
                        getShareUrl(),
                      ]
                        .filter(Boolean)
                        .join("\n")
                    }
                  />
                </>
              }
            />
            {result.loanAmount === 0 && (
              <Alert tone="info">
                With 100% down there’s no loan — only taxes, insurance and HOA remain.
              </Alert>
            )}
            <BreakdownDonut
              title="Monthly payment breakdown"
              centerLabel="Per month"
              centerValue={formatCurrency(result.monthly.total, { cents: false })}
              slices={[
                {
                  key: "pi",
                  label: "Principal & interest",
                  value: result.monthly.principalAndInterest,
                  color: "rgb(var(--chart-1))",
                },
                {
                  key: "tax",
                  label: "Property tax",
                  value: result.monthly.tax,
                  color: "rgb(var(--chart-3))",
                },
                {
                  key: "ins",
                  label: "Insurance",
                  value: result.monthly.insurance,
                  color: "rgb(var(--chart-2))",
                },
                {
                  key: "hoa",
                  label: "HOA",
                  value: result.monthly.hoa,
                  color: "rgb(var(--chart-4))",
                },
                {
                  key: "pmi",
                  label: "PMI",
                  value: result.monthly.pmi,
                  color: "rgb(var(--chart-5))",
                },
              ]}
            />
            {result.rows.length > 0 && (
              <AmortizationChart data={yearlyAmortization(result.rows, 12, result.loanAmount)} />
            )}
            <ScheduleTable
              title="Monthly schedule"
              rows={result.rows}
              rowKey={(r) => r.period}
              columns={[
                { header: "#", cell: (r) => r.period, align: "left" },
                { header: "Date", cell: (r) => formatDate(r.date), align: "left" },
                { header: "P&I", cell: (r) => formatCurrency(r.payment) },
                { header: "Principal", cell: (r) => formatCurrency(r.principal + r.extra) },
                { header: "Interest", cell: (r) => formatCurrency(r.interest) },
                { header: "PMI", cell: (r) => formatCurrency(r.pmi) },
                {
                  header: "Tax + ins. + HOA",
                  cell: (r) => formatCurrency(r.tax + r.insurance + r.hoa),
                },
                { header: "Total paid", cell: (r) => formatCurrency(r.totalOutflow) },
                { header: "Balance", cell: (r) => formatCurrency(r.balance) },
              ]}
              actions={
                <ExportButton
                  filename="mortgage-schedule"
                  rows={result.rows}
                  columns={[
                    { header: "Payment #", value: (r) => r.period },
                    { header: "Date", value: (r) => r.date },
                    { header: "Principal & interest", value: (r) => r.payment },
                    { header: "Principal", value: (r) => r.principal },
                    { header: "Extra principal", value: (r) => r.extra },
                    { header: "Interest", value: (r) => r.interest },
                    { header: "PMI", value: (r) => r.pmi },
                    { header: "Property tax", value: (r) => r.tax },
                    { header: "Insurance", value: (r) => r.insurance },
                    { header: "HOA", value: (r) => r.hoa },
                    { header: "Total paid", value: (r) => r.totalOutflow },
                    { header: "Balance", value: (r) => r.balance },
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
