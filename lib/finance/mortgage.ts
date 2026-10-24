import { D, ZERO, cents, num, type Dec } from "./decimal";
import { amortize, type AmortizationRow, type LoanExtras, type LoanResult } from "./loan";

export type AmountOrPercent = { mode: "amount" | "percent"; value: number };

export interface MortgageInput {
  homePrice: number;
  /** Down payment in dollars, or percent (decimal) of the home price. */
  downPayment: AmountOrPercent;
  annualRate: number;
  termYears: number;
  /** Annual property tax in dollars, or percent (decimal) of the home price per year. */
  propertyTax: AmountOrPercent;
  insuranceAnnual: number;
  hoaMonthly: number;
  /** Annual PMI rate (decimal) applied to the original loan amount while LTV > 80%. */
  pmiRate: number;
  startDate: string;
  extras?: LoanExtras;
}

export interface MortgageRow extends AmortizationRow {
  pmi: number;
  tax: number;
  insurance: number;
  hoa: number;
  totalOutflow: number;
}

export interface MortgageBreakdown {
  principalAndInterest: number;
  tax: number;
  insurance: number;
  hoa: number;
  pmi: number;
  total: number;
}

export interface MortgageResult {
  loanAmount: number;
  downPaymentAmount: number;
  ltv: number;
  pmiRequired: boolean;
  /** First-month payment breakdown. */
  monthly: MortgageBreakdown;
  /** Date of the first payment without PMI, or null if PMI never applied. */
  pmiDropOffDate: string | null;
  pmiMonths: number;
  totalPmi: number;
  totalCostOfOwnership: number;
  loan: LoanResult;
  rows: MortgageRow[];
}

export function resolveAmount(value: AmountOrPercent, base: number): number {
  return value.mode === "percent" ? num(new D(base).times(value.value)) : value.value;
}

export function mortgage(input: MortgageInput): MortgageResult {
  const downPaymentAmount = Math.min(resolveAmount(input.downPayment, input.homePrice), input.homePrice);
  const loanAmount = num(cents(new D(input.homePrice).minus(downPaymentAmount)));
  const ltv = input.homePrice > 0 ? loanAmount / input.homePrice : 0;
  const pmiRequired = ltv > 0.8 && input.pmiRate > 0;

  const loan = amortize({
    principal: loanAmount,
    annualRate: input.annualRate,
    termMonths: input.termYears * 12,
    paymentsPerYear: 12,
    startDate: input.startDate,
    extras: input.extras,
  });

  const taxMonthly = cents(new D(resolveAmount(input.propertyTax, input.homePrice)).div(12));
  const insuranceMonthly = cents(new D(input.insuranceAnnual).div(12));
  const hoa = cents(input.hoaMonthly);
  const pmiMonthly = pmiRequired ? cents(new D(loanAmount).times(input.pmiRate).div(12)) : ZERO;
  // PMI is removed automatically once the balance reaches 78% of the original home value.
  const pmiThreshold = new D(input.homePrice).times(0.78);

  let totalPmi: Dec = ZERO;
  let pmiMonths = 0;
  let pmiDropOffDate: string | null = null;
  let balanceBefore = new D(loanAmount);
  const rows: MortgageRow[] = loan.rows.map((row) => {
    const charged = pmiRequired && balanceBefore.gt(pmiThreshold);
    const pmi = charged ? pmiMonthly : ZERO;
    if (charged) {
      pmiMonths += 1;
      totalPmi = totalPmi.plus(pmi);
    } else if (pmiRequired && pmiDropOffDate === null) {
      pmiDropOffDate = row.date;
    }
    balanceBefore = new D(row.balance);
    return {
      ...row,
      pmi: num(pmi),
      tax: num(taxMonthly),
      insurance: num(insuranceMonthly),
      hoa: num(hoa),
      totalOutflow: num(
        new D(row.payment).plus(row.extra).plus(pmi).plus(taxMonthly).plus(insuranceMonthly).plus(hoa),
      ),
    };
  });

  const termMonths = input.termYears * 12;
  const firstPmi = rows[0]?.pmi ?? 0;
  const pi = new D(loan.payment);
  const monthlyTotal = pi.plus(taxMonthly).plus(insuranceMonthly).plus(hoa).plus(firstPmi);
  // Ownership costs (tax, insurance, HOA) continue for the full term even if the loan is paid early.
  const totalCostOfOwnership = new D(downPaymentAmount)
    .plus(loan.totalPaid)
    .plus(totalPmi)
    .plus(taxMonthly.plus(insuranceMonthly).plus(hoa).times(termMonths));

  return {
    loanAmount,
    downPaymentAmount,
    ltv,
    pmiRequired,
    monthly: {
      principalAndInterest: num(pi),
      tax: num(taxMonthly),
      insurance: num(insuranceMonthly),
      hoa: num(hoa),
      pmi: firstPmi,
      total: num(monthlyTotal),
    },
    pmiDropOffDate,
    pmiMonths,
    totalPmi: num(totalPmi),
    totalCostOfOwnership: num(totalCostOfOwnership),
    loan,
    rows,
  };
}
