/** Date helpers that work in UTC so schedules never shift with the viewer's time zone. */

export function parseISODate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Adds whole months, clamping to the last day of the target month (Jan 31 + 1 → Feb 28/29). */
export function addMonths(date: Date, months: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + months;
  const targetYear = y + Math.floor(m / 12);
  const targetMonth = ((m % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, targetMonth, Math.min(date.getUTCDate(), lastDay)));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/** Date of the k-th periodic payment (k ≥ 1) after `start` for a given payments-per-year. */
export function paymentDate(start: Date, k: number, perYear: number): Date {
  switch (perYear) {
    case 52:
      return addDays(start, 7 * k);
    case 26:
      return addDays(start, 14 * k);
    case 24: {
      const base = addMonths(start, Math.floor(k / 2));
      return k % 2 === 0 ? base : addDays(base, 15);
    }
    default:
      return addMonths(start, Math.round((12 / perYear) * k));
  }
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Whole months between two dates (b − a), ignoring the day remainder. */
export function monthsBetween(a: Date, b: Date): number {
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) months -= 1;
  return months;
}
