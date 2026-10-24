"use client";

import { z } from "zod";
import { futureCost, inflationSeries, purchasingPower, realReturn, type InflationRow } from "@/lib/finance";
import { money, numberText, percent } from "@/lib/schema";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { pctPhrase, yearsPhrase } from "@/lib/text";
import { useCalculator } from "@/components/calculator/useCalculator";
import { CalculatorPanels, InputGroup } from "@/components/calculator/CalculatorPanels";
import { ResultSummary } from "@/components/calculator/ResultSummary";
import { ScheduleTable } from "@/components/calculator/ScheduleTable";
import { CopyResultsButton, ExportButton, ShareButton } from "@/components/calculator/ActionButtons";
import { MoneyField, NumberField, PercentField } from "@/components/ui/FormFields";
import { GrowthChart } from "@/components/charts";

const schema = z.object({
  amount: money(),
  inflation: percent({ max: 50, maxMessage: "Use inflation of 50% or less" }),
  years: numberText({ min: 0, max: 100, maxMessage: "Up to 100 years" }),
  nominalReturn: percent({ optional: true }),
});

type Form = z.input<typeof schema>;
type Inputs = z.output<typeof schema>;

const defaults: Form = { amount: "100", inflation: "3", years: "10", nominalReturn: "7" };

interface Computed {
  futureCost: number;
  purchasingPower: number;
  realReturn: number;
  naiveReal: number;
  lostValue: number;
  rows: InflationRow[];
}

const compute = (v: Inputs): Computed => {
  const pp = purchasingPower(v.amount, v.inflation, v.years);
  return {
    futureCost: futureCost(v.amount, v.inflation, v.years),
    purchasingPower: pp,
    realReturn: realReturn(v.nominalReturn, v.inflation),
    naiveReal: v.nominalReturn - v.inflation,
    lostValue: v.amount > 0 ? 1 - pp / v.amount : 0,
    rows: inflationSeries(v.amount, v.inflation, v.years),
  };
};

function summaryText(v: Inputs, r: Computed): string {
  return `At ${pctPhrase(v.inflation)} inflation, something that costs ${formatCurrency(v.amount)} today will cost about ${formatCurrency(r.futureCost)} in ${yearsPhrase(v.years)}. Put the other way, ${formatCurrency(v.amount)} kept in cash then will only buy what ${formatCurrency(r.purchasingPower)} buys today — it loses ${formatPercent(r.lostValue, 1)} of its value.`;
}

export default function Inflation() {
  const { form, result, inputs, isStale, getShareUrl } = useCalculator(schema, defaults, compute);

  return (
    <CalculatorPanels
      form={form}
      isStale={isStale}
      inputs={
        <>
          <InputGroup title="Prices">
            <MoneyField name="amount" label="Amount" tooltip="A price today (or a sum of money) to project forward." />
            <PercentField name="inflation" label="Annual inflation rate" slider={{ min: 0, max: 15, step: 0.1 }} tooltip="How fast prices rise each year on average. The U.S. long-run average is roughly 3%." />
            <NumberField name="years" label="Years" suffix="years" slider={{ min: 1, max: 50 }} />
          </InputGroup>
          <InputGroup title="Real return">
            <PercentField name="nominalReturn" label="Nominal investment return" tooltip="The return you earn before accounting for inflation." />
          </InputGroup>
        </>
      }
      results={
        result &&
        inputs && (
          <>
            <ResultSummary
              headlineLabel={`Future cost in ${yearsPhrase(inputs.years)}`}
              headline={formatCurrency(result.futureCost)}
              summary={summaryText(inputs, result)}
              stats={[
                { label: "Purchasing power of today's amount", value: formatCurrency(result.purchasingPower), tone: "bad" },
                { label: "Real return (Fisher)", value: formatPercent(result.realReturn, 4), hint: `${formatPercent(inputs.nominalReturn)} nominal − inflation, compounded` },
                { label: "Simple subtraction (approx.)", value: formatPercent(result.naiveReal, 4), hint: `overstates by ${formatNumber((result.naiveReal - result.realReturn) * 100, 4)} pts` },
              ]}
              actions={
                <>
                  <ShareButton getUrl={getShareUrl} />
                  <CopyResultsButton
                    getText={() =>
                      [
                        `Future cost: ${formatCurrency(result.futureCost)}`,
                        `Purchasing power: ${formatCurrency(result.purchasingPower)}`,
                        `Real return: ${formatPercent(result.realReturn, 4)}`,
                        summaryText(inputs, result),
                        getShareUrl(),
                      ].join("\n")
                    }
                  />
                </>
              }
            />
            {result.rows.length > 1 && (
              <GrowthChart
                title="Rising prices vs. shrinking purchasing power"
                variant="line"
                xKey="year"
                xLabel="Year"
                data={result.rows.map((r) => ({ year: r.year, futureCost: r.futureCost, purchasingPower: r.purchasingPower }))}
                series={[
                  { key: "futureCost", label: "Cost of the same item", color: "rgb(var(--chart-3))" },
                  { key: "purchasingPower", label: "What your cash can buy", color: "rgb(var(--chart-1))" },
                ]}
              />
            )}
            <ScheduleTable
              title="Year by year"
              defaultOpen={result.rows.length <= 31}
              rows={result.rows}
              rowKey={(r) => r.year}
              columns={[
                { header: "Year", cell: (r) => formatNumber(r.year, 2), align: "left" },
                { header: "Future cost", cell: (r) => formatCurrency(r.futureCost) },
                { header: "Purchasing power", cell: (r) => formatCurrency(r.purchasingPower) },
              ]}
              actions={
                <ExportButton
                  filename="inflation-table"
                  rows={result.rows}
                  columns={[
                    { header: "Year", value: (r) => r.year },
                    { header: "Future cost", value: (r) => r.futureCost },
                    { header: "Purchasing power", value: (r) => r.purchasingPower },
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
