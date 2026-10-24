"use client";

import { z } from "zod";
import { cagr, cagrSeries, type CagrSeriesResult } from "@/lib/finance";
import { money, numberText } from "@/lib/schema";
import { formatCurrency, formatPercent, parseNumber } from "@/lib/format";
import { yearsPhrase } from "@/lib/text";
import { useCalculator } from "@/components/calculator/useCalculator";
import { CalculatorPanels, InputGroup } from "@/components/calculator/CalculatorPanels";
import { Alert, ResultSummary } from "@/components/calculator/ResultSummary";
import { ScheduleTable } from "@/components/calculator/ScheduleTable";
import {
  CopyResultsButton,
  ExportButton,
  ShareButton,
} from "@/components/calculator/ActionButtons";
import { FieldChrome } from "@/components/ui/Field";
import { MoneyField, NumberField, ToggleField } from "@/components/ui/FormFields";
import { GrowthChart } from "@/components/charts";
import { useFormContext } from "react-hook-form";

const MAX_VALUES = 51;

const schema = z
  .object({
    mode: z.enum(["simple", "series"]),
    start: money({ optional: true }),
    end: money({ optional: true }),
    years: numberText({ optional: true, min: 0, max: 100, maxMessage: "Up to 100 years" }),
    values: z.string().max(2000),
  })
  .transform((v, ctx) => {
    const list = v.values
      .split(/[\n,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => parseNumber(s));
    if (v.mode === "series") {
      if (list.some((n) => n === null || n < 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["values"],
          message: "Use positive numbers separated by commas or new lines",
        });
        return z.NEVER;
      }
      if (list.length < 2 || list.length > MAX_VALUES) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["values"],
          message: `Enter between 2 and ${MAX_VALUES} yearly values`,
        });
        return z.NEVER;
      }
      if ((list[0] ?? 0) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["values"],
          message: "The first value must be above $0",
        });
        return z.NEVER;
      }
    } else {
      if (v.start <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["start"],
          message: "Enter a starting value above $0",
        });
        return z.NEVER;
      }
      if (v.years <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["years"],
          message: "Enter a number of years above 0",
        });
        return z.NEVER;
      }
    }
    return { ...v, list: list.filter((n): n is number => n !== null) };
  });

type Form = z.input<typeof schema>;
type Inputs = z.output<typeof schema>;

const defaults: Form = {
  mode: "simple",
  start: "1,000",
  end: "2,000",
  years: "5",
  values: "10000, 11800, 10900, 13200, 15100, 14300, 17600",
};

interface Computed {
  rate: number | null;
  start: number;
  end: number;
  years: number;
  series: CagrSeriesResult | null;
}

const compute = (v: Inputs): Computed => {
  if (v.mode === "series") {
    const series = cagrSeries(v.list);
    return {
      rate: series.cagr,
      start: v.list[0] ?? 0,
      end: v.list[v.list.length - 1] ?? 0,
      years: v.list.length - 1,
      series,
    };
  }
  return {
    rate: cagr(v.start, v.end, v.years),
    start: v.start,
    end: v.end,
    years: v.years,
    series: null,
  };
};

function summaryText(r: Computed): string {
  if (r.rate === null) return "";
  const dir = r.rate >= 0 ? "grew" : "shrank";
  const smooth = `Growing from ${formatCurrency(r.start)} to ${formatCurrency(r.end)} over ${yearsPhrase(r.years)}, your investment ${dir} at a compound annual rate of ${formatPercent(r.rate)} — as if it had earned exactly that every single year.`;
  if (!r.series || r.series.averageReturn === null) return smooth;
  return `${smooth} The simple average of the yearly returns is ${formatPercent(r.series.averageReturn)}, which overstates real growth whenever returns bounce around.`;
}

function ValuesField() {
  const { register, getFieldState, formState } = useFormContext<Form>();
  const error = getFieldState("values", formState).error?.message;
  return (
    <FieldChrome
      id="f-values"
      label="Yearly values"
      hint="One value per year, starting with the initial value. Separate with commas or new lines."
      error={error}
      tooltip="What your investment was worth at the start, then at the end of each year. We'll compare the real bumpy path with a smooth line."
    >
      <textarea
        id="f-values"
        rows={4}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? "f-values-error" : "f-values-hint"}
        className={`w-full rounded-lg border bg-surface px-3 py-2 font-mono text-sm text-ink ${error ? "border-danger" : "border-border"}`}
        {...register("values")}
      />
    </FieldChrome>
  );
}

export default function Cagr() {
  const { form, result, inputs, isStale, getShareUrl } = useCalculator(schema, defaults, compute);
  const mode = form.watch("mode");
  const s = result?.series ?? null;

  return (
    <CalculatorPanels
      form={form}
      isStale={isStale}
      inputs={
        <>
          <ToggleField
            name="mode"
            label="Input"
            options={[
              { value: "simple", label: "Start & end" },
              { value: "series", label: "Yearly values" },
            ]}
          />
          {mode === "simple" ? (
            <InputGroup>
              <MoneyField
                name="start"
                label="Starting value"
                tooltip="What the investment was worth at the beginning."
              />
              <MoneyField
                name="end"
                label="Ending value"
                tooltip="What it's worth now (or at the end of the period)."
              />
              <NumberField
                name="years"
                label="Years"
                suffix="years"
                tooltip="How many years you held the investment. Fractions like 2.5 are fine."
              />
            </InputGroup>
          ) : (
            <ValuesField />
          )}
        </>
      }
      results={
        result &&
        inputs && (
          <>
            <ResultSummary
              headlineLabel="Compound annual growth rate (CAGR)"
              headline={result.rate === null ? "—" : formatPercent(result.rate)}
              summary={summaryText(result)}
              stats={[
                {
                  label: "Total growth",
                  value: result.start > 0 ? formatPercent(result.end / result.start - 1) : "—",
                  tone: result.end >= result.start ? "good" : "bad",
                },
                {
                  label: "Growth multiple",
                  value: result.start > 0 ? `${(result.end / result.start).toFixed(2)}×` : "—",
                },
                ...(s && s.volatility !== null
                  ? [
                      { label: "Volatility (std. dev.)", value: formatPercent(s.volatility) },
                      {
                        label: "Best year",
                        value: formatPercent(s.bestYear ?? NaN),
                        tone: "good" as const,
                      },
                      {
                        label: "Worst year",
                        value: formatPercent(s.worstYear ?? NaN),
                        tone: "bad" as const,
                      },
                    ]
                  : []),
              ]}
              actions={
                <>
                  <ShareButton getUrl={getShareUrl} />
                  <CopyResultsButton
                    getText={() =>
                      [
                        `CAGR: ${result.rate === null ? "—" : formatPercent(result.rate)}`,
                        summaryText(result),
                        getShareUrl(),
                      ].join("\n")
                    }
                  />
                </>
              }
            />
            {result.end === 0 && (
              <Alert tone="info">
                An ending value of $0 means a −100% CAGR: the investment was wiped out.
              </Alert>
            )}
            {s && (
              <>
                <GrowthChart
                  title="Actual path vs. smooth CAGR line"
                  variant="line"
                  xKey="year"
                  xLabel="Year"
                  data={s.points.map((p) => ({ year: p.year, actual: p.actual, smooth: p.smooth }))}
                  series={[
                    { key: "actual", label: "Actual value", color: "rgb(var(--chart-1))" },
                    {
                      key: "smooth",
                      label: `Smooth ${result.rate === null ? "" : formatPercent(result.rate)} CAGR`,
                      color: "rgb(var(--chart-2))",
                      dashed: true,
                    },
                  ]}
                />
                <ScheduleTable
                  title="Year-by-year returns"
                  defaultOpen
                  rows={s.points}
                  rowKey={(p) => p.year}
                  columns={[
                    { header: "Year", cell: (p) => p.year, align: "left" },
                    { header: "Value", cell: (p) => formatCurrency(p.actual ?? NaN) },
                    {
                      header: "Return that year",
                      cell: (p) => (p.yearReturn === null ? "—" : formatPercent(p.yearReturn)),
                    },
                    { header: "CAGR line", cell: (p) => formatCurrency(p.smooth) },
                  ]}
                  actions={
                    <ExportButton
                      filename="cagr-yearly-returns"
                      rows={s.points}
                      columns={[
                        { header: "Year", value: (p) => p.year },
                        { header: "Value", value: (p) => p.actual },
                        {
                          header: "Return (%)",
                          value: (p) => (p.yearReturn === null ? null : p.yearReturn * 100),
                        },
                        { header: "CAGR line", value: (p) => p.smooth },
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
