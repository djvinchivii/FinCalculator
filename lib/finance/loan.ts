import { D, ZERO, cents, num, type Dec } from "./decimal";
import { paymentDate, parseISODate, toISODate } from "./dates";

/** Payment frequencies supported for loans (payments per year). */
export type PaymentFrequency = 12 | 24 | 26 | 52;

export const PAYMENT_FREQUENCY_OPTIONS: { value: PaymentFrequency; label: string }[] = [
  { value: 12, label: "Monthly" },
  { value: 24, label: "Semi-monthly" },
  { value: 26, label: "Bi-weekly" },
  { value: 52, label: "Weekly" },
];

export interface LoanExtras {
  /** Extra principal added to every payment. */
  perPayment?: number;
  /** Extra principal paid once a year (on every 12-month anniversary payment). */
  yearly?: number;
  /** One-time extra principal applied on the first payment on/after `oneTimeDate`. */
  oneTime?: number;
  oneTimeDate?: string;
}

export interface LoanInput {
  principal: number;
  /** Nominal annual rate as a decimal. */
  annualRate: number;
  termMonths: number;
  paymentsPerYear: PaymentFrequency;
  /** ISO date the loan starts; the first payment is one period later. */
  startDate: string;
  extras?: LoanExtras;
}

export interface AmortizationRow {
  period: number;
  date: string;
  payment: number;
  interest: number;
  principal: number;
  extra: number;
  balance: number;
}

export interface LoanSchedule {
  payment: number;
  rows: AmortizationRow[];
  totalPaid: number;
  totalInterest: number;
  payoffDate: string;
  numberOfPayments: number;
}

export interface LoanResult extends LoanSchedule {
  /** Schedule without any extra payments, for comparison. */
  baseline: LoanSchedule;
  interestSaved: number;
  paymentsSaved: number;
  hasExtras: boolean;
}

export function numberOfPayments(termMonths: number, paymentsPerYear: number): number {
  return Math.max(1, Math.round((termMonths / 12) * paymentsPerYear));
}

/** Level periodic payment M = P·r / (1 − (1 + r)^−n); r = 0 → P / n. Full precision. */
export function loanPaymentExact(principal: number, ratePerPeriod: number, n: number): Dec {
  const p = new D(principal);
  const r = new D(ratePerPeriod);
  if (n <= 0) return p;
  if (r.isZero()) return p.div(n);
  return p.times(r).div(new D(1).minus(r.plus(1).pow(-n)));
}

/** Level periodic payment rounded to cents. */
export function loanPayment(principal: number, annualRate: number, n: number, paymentsPerYear: number): number {
  return num(cents(loanPaymentExact(principal, annualRate / paymentsPerYear, n)));
}

function buildSchedule(input: LoanInput, extras: LoanExtras | undefined): LoanSchedule {
  const ppy = input.paymentsPerYear;
  const n = numberOfPayments(input.termMonths, ppy);
  const r = new D(input.annualRate).div(ppy);
  const payment = cents(loanPaymentExact(input.principal, r.toNumber(), n));
  const start = parseISODate(input.startDate) ?? new Date(Date.UTC(2025, 0, 1));
  const oneTimeDate = extras?.oneTimeDate ? parseISODate(extras.oneTimeDate) : null;
  const perPayment = cents(extras?.perPayment ?? 0);
  const yearly = cents(extras?.yearly ?? 0);
  let oneTimeLeft = cents(extras?.oneTime ?? 0);

  let balance = cents(input.principal);
  let totalPaid: Dec = ZERO;
  let totalInterest: Dec = ZERO;
  const rows: AmortizationRow[] = [];

  for (let k = 1; k <= n && balance.gt(0); k++) {
    const date = paymentDate(start, k, ppy);
    const interest = cents(balance.times(r));
    let scheduledPrincipal = payment.minus(interest);
    let extra = perPayment;
    if (yearly.gt(0) && k % ppy === 0) extra = extra.plus(yearly);
    if (oneTimeLeft.gt(0) && (!oneTimeDate || date.getTime() >= oneTimeDate.getTime())) {
      extra = extra.plus(oneTimeLeft);
      oneTimeLeft = ZERO;
    }

    // Final scheduled payment (or any payment that would overshoot) absorbs rounding drift.
    if (k === n || scheduledPrincipal.plus(extra).gte(balance)) {
      if (scheduledPrincipal.gte(balance) || k === n) {
        scheduledPrincipal = balance;
        extra = ZERO;
      } else {
        extra = balance.minus(scheduledPrincipal);
      }
    }
    if (scheduledPrincipal.lt(0)) scheduledPrincipal = ZERO;

    const rowPayment = interest.plus(scheduledPrincipal);
    balance = balance.minus(scheduledPrincipal).minus(extra);
    totalPaid = totalPaid.plus(rowPayment).plus(extra);
    totalInterest = totalInterest.plus(interest);
    rows.push({
      period: k,
      date: toISODate(date),
      payment: num(rowPayment),
      interest: num(interest),
      principal: num(scheduledPrincipal),
      extra: num(extra),
      balance: num(balance),
    });
  }

  const last = rows[rows.length - 1];
  return {
    payment: num(payment),
    rows,
    totalPaid: num(totalPaid),
    totalInterest: num(totalInterest),
    payoffDate: last ? last.date : toISODate(start),
    numberOfPayments: rows.length,
  };
}

/** Full amortization schedule with optional extra payments and a no-extras baseline. */
export function amortize(input: LoanInput): LoanResult {
  const extras = input.extras;
  const hasExtras =
    (extras?.perPayment ?? 0) > 0 || (extras?.yearly ?? 0) > 0 || (extras?.oneTime ?? 0) > 0;
  const baseline = buildSchedule(input, undefined);
  const actual = hasExtras ? buildSchedule(input, extras) : baseline;
  return {
    ...actual,
    baseline,
    hasExtras,
    interestSaved: num(new D(baseline.totalInterest).minus(actual.totalInterest)),
    paymentsSaved: baseline.numberOfPayments - actual.numberOfPayments,
  };
}
