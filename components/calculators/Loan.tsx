"use client";

import { z } from "zod";
import {
  PAYMENT_FREQUENCY_OPTIONS,
  amortize,
  type LoanResult,
  type PaymentFrequency,
} from "@/lib/finance";
import { isoDate, money, numberText, percent, toOptions } from "@/lib/schema";
import { formatCurrency, formatDate, formatDuration, formatMonthYear } from "@/lib/format";
import { perPeriod, pctPhrase } from "@/lib/text";
import { useCalculator } from "@/components/calculator/useCalculator";
import { CalculatorPanels, InputGroup } from "@/components/calculator/CalculatorPanels";
import { ResultSummary, type Stat } from "@/components/calculator/ResultSummary";
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
  SelectField,
  ToggleField,
} from "@/components/ui/FormFields";
import { AmortizationChart } from "@/components/charts";
import { localTodayISO, yearlyAmortization, scheduleCsvColumns } from "./loan-shared";

const schema = z
  .object({
    principal: money({ exclusiveMin: true, min: 0, minMessage: "Enter a loan amount above $0" }),
    annualRate: percent(),
    term: numberText({ min: 0, exclusiveMin: true }),
    termUnit: z.enum(["years", "months"]),
    paymentsPerYear: z
      .enum(["12", "24", "26", "52"])
      .transform((v) => Number(v) as PaymentFrequency),
    startDate: isoDate(),
    extraPerPayment: money({ optional: true }),
    extraYearly: money({ optional: true }),
    extraOneTime: money({ optional: true }),
    extraOneTimeDate: z.string(),
  })
  .superRefine((v, ctx) => {
    const months = v.termUnit === "years" ? v.term * 12 : v.term;
    if (months > 1200)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["term"],
        message: "Terms are capped at 100 years",
      });
    if (v.extraOneTime > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(v.extraOneTimeDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["extraOneTimeDate"],
        message: "Pick the date for your one-time payment",
      });
    }
  });

type Form = z.input<typeof schema>;
type Inputs = z.output<typeof schema>;

const defaults: Form = {
  principal: "200,000",
  annualRate: "6",
  term: "30",
  termUnit: "years",
  paymentsPerYear: "12",
  startDate: "2026-01-01",
  extraPerPayment: "",
  extraYearly: "",
  extraOneTime: "",
  extraOneTimeDate: "",
};

const clientDefaults = (): Partial<Form> => ({ startDate: localTodayISO() });

const compute = (v: Inputs): LoanResult =>
  amortize({
    principal: v.principal,
    annualRate: v.annualRate,
    termMonths: v.termUnit === "years" ? v.term * 12 : v.term,
    paymentsPerYear: v.paymentsPerYear,
    startDate: v.startDate,
    extras: {
      perPayment: v.extraPerPayment,
      yearly: v.extraYearly,
      oneTime: v.extraOneTime,
      oneTimeDate: v.extraOneTimeDate || undefined,
    },
  });

function summaryText(v: Inputs, r: LoanResult): string {
  const base = `Borrowing ${formatCurrency(v.principal, { cents: false })} at ${pctPhrase(v.annualRate)} means paying ${formatCurrency(r.payment)} ${perPeriod(v.paymentsPerYear)}. Over the life of the loan you'll pay ${formatCurrency(r.totalInterest, { cents: false })} in interest — ${formatCurrency(r.totalPaid, { cents: false })} in total — and be debt-free in ${formatMonthYear(r.payoffDate)}.`;
  if (!r.hasExtras || r.interestSaved <= 0) return base;
  return `${base} Your extra payments save ${formatCurrency(r.interestSaved, { cents: false })} in interest and ${r.paymentsSaved} payments.`;
}

export default function Loan() {
  const { form, result, inputs, isStale, getShareUrl } = useCalculator(
    schema,
    defaults,
    compute,
    clientDefaults,
  );

  const stats: Stat[] = result
    ? [
        { label: "Total interest", value: formatCurrency(result.totalInterest), tone: "bad" },
        { label: "Total paid", value: formatCurrency(result.totalPaid) },
        {
          label: "Payoff date",
          value: formatMonthYear(result.payoffDate),
          hint: `${result.numberOfPayments} payments`,
        },
      ]
    : [];
  if (result?.hasExtras) {
    const perYear = inputs?.paymentsPerYear ?? 12;
    stats.push(
      { label: "Interest saved", value: formatCurrency(result.interestSaved), tone: "good" },
      {
        label: "Time saved",
        value: formatDuration((result.paymentsSaved / perYear) * 12),
        tone: "good",
        hint: `${result.paymentsSaved} fewer payments`,
      },
    );
  }

  return (
    <CalculatorPanels
      form={form}
      isStale={isStale}
      inputs={
        <>
          <InputGroup title="Loan">
            <MoneyField
              name="principal"
              label="Loan amount"
              tooltip="How much you're borrowing (the principal)."
            />
            <PercentField
              name="annualRate"
              label="Annual interest rate"
              slider={{ min: 0, max: 25, step: 0.05 }}
              tooltip="The yearly rate the lender charges (APR), before it's split into per-payment interest."
            />
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <NumberField
                name="term"
                label="Loan term"
                tooltip="How long you have to repay the loan."
              />
              <ToggleField
                name="termUnit"
                label="Term unit"
                options={[
                  { value: "years", label: "Years" },
                  { value: "months", label: "Months" },
                ]}
              />
            </div>
            <SelectField
              name="paymentsPerYear"
              label="Payment frequency"
              options={toOptions(PAYMENT_FREQUENCY_OPTIONS)}
              tooltip="How often you make a payment. The annual rate is divided by the number of payments per year."
            />
            <DateField
              name="startDate"
              label="Loan start date"
              hint="Your first payment is due one period after this date."
              tooltip="The date the loan is funded; it sets your payoff date."
            />
          </InputGroup>
          <InputGroup title="Extra payments (optional)">
            <MoneyField
              name="extraPerPayment"
              label="Extra with every payment"
              tooltip="Extra principal added to each regular payment. Even small amounts cut interest a lot."
            />
            <MoneyField
              name="extraYearly"
              label="Extra once a year"
              tooltip="An additional principal payment each year, e.g. from a tax refund or bonus."
            />
            <MoneyField
              name="extraOneTime"
              label="One-time extra payment"
              tooltip="A single lump sum toward principal."
            />
            <DateField
              name="extraOneTimeDate"
              label="One-time payment date"
              hint="Applied to the first payment on or after this date."
            />
          </InputGroup>
        </>
      }
      results={
        result &&
        inputs && (
          <>
            <ResultSummary
              headlineLabel={`Payment ${perPeriod(inputs.paymentsPerYear).replace(/^a /, "per ")}`}
              headline={formatCurrency(result.payment)}
              summary={summaryText(inputs, result)}
              stats={stats}
              actions={
                <>
                  <ShareButton getUrl={getShareUrl} />
                  <CopyResultsButton
                    getText={() =>
                      [
                        `Loan payment: ${formatCurrency(result.payment)} ${perPeriod(inputs.paymentsPerYear)}`,
                        `Total interest: ${formatCurrency(result.totalInterest)}`,
                        `Total paid: ${formatCurrency(result.totalPaid)}`,
                        `Payoff date: ${formatDate(result.payoffDate)}`,
                        result.hasExtras
                          ? `Interest saved with extra payments: ${formatCurrency(result.interestSaved)}`
                          : "",
                        getShareUrl(),
                      ]
                        .filter(Boolean)
                        .join("\n")
                    }
                  />
                </>
              }
            />
            <AmortizationChart
              data={yearlyAmortization(result.rows, inputs.paymentsPerYear, inputs.principal)}
            />
            <ScheduleTable
              title="Amortization schedule"
              rows={result.rows}
              rowKey={(r) => r.period}
              columns={[
                { header: "#", cell: (r) => r.period, align: "left" },
                { header: "Date", cell: (r) => formatDate(r.date), align: "left" },
                { header: "Payment", cell: (r) => formatCurrency(r.payment) },
                { header: "Principal", cell: (r) => formatCurrency(r.principal) },
                { header: "Interest", cell: (r) => formatCurrency(r.interest) },
                ...(result.hasExtras
                  ? [
                      {
                        header: "Extra",
                        cell: (r: LoanResult["rows"][number]) => formatCurrency(r.extra),
                      },
                    ]
                  : []),
                { header: "Balance", cell: (r) => formatCurrency(r.balance) },
              ]}
              actions={
                <ExportButton
                  filename="loan-amortization-schedule"
                  rows={result.rows}
                  columns={scheduleCsvColumns}
                />
              }
            />
          </>
        )
      }
    />
  );
}
