import type { AmortizationRow } from "@/lib/finance";
import type { CsvColumn } from "@/lib/csv";
import type { AmortizationYear } from "@/components/charts";

/** Today's date in the viewer's time zone as YYYY-MM-DD. */
export function localTodayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Rolls a payment schedule up into loan years for the principal-vs-interest chart. */
export function yearlyAmortization(
  rows: AmortizationRow[],
  paymentsPerYear: number,
  principal: number,
): AmortizationYear[] {
  const years: AmortizationYear[] = [];
  for (const row of rows) {
    const year = Math.ceil(row.period / paymentsPerYear);
    let entry = years[years.length - 1];
    if (!entry || entry.year !== year) {
      entry = { year, principal: 0, interest: 0, balance: principal };
      years.push(entry);
    }
    entry.principal = Math.round((entry.principal + row.principal + row.extra) * 100) / 100;
    entry.interest = Math.round((entry.interest + row.interest) * 100) / 100;
    entry.balance = row.balance;
  }
  return years;
}

export const scheduleCsvColumns: CsvColumn<AmortizationRow>[] = [
  { header: "Payment #", value: (r) => r.period },
  { header: "Date", value: (r) => r.date },
  { header: "Payment", value: (r) => r.payment },
  { header: "Principal", value: (r) => r.principal },
  { header: "Interest", value: (r) => r.interest },
  { header: "Extra principal", value: (r) => r.extra },
  { header: "Balance", value: (r) => r.balance },
];
