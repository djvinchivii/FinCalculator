/** Month helpers for the Budget Planner. Month keys look like "2026-10". */

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Today's date in the viewer's time zone as YYYY-MM-DD. */
export function localToday(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function monthKeyOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split("-");
  return { year: Number(y), month: Number(m) };
}

export function shiftMonth(key: string, delta: number): string {
  const { year, month } = parseMonthKey(key);
  const zeroBased = year * 12 + (month - 1) + delta;
  return `${Math.floor(zeroBased / 12)}-${pad2((zeroBased % 12) + 1)}`;
}

export function daysInMonth(key: string): number {
  const { year, month } = parseMonthKey(key);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** "October 2026". */
export function monthLabel(key: string): string {
  const { year, month } = parseMonthKey(key);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/** Whole days from `a` to `b` (both YYYY-MM-DD). */
export function daysBetween(a: string, b: string): number {
  const ta = Date.UTC(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1, Number(a.slice(8, 10)));
  const tb = Date.UTC(Number(b.slice(0, 4)), Number(b.slice(5, 7)) - 1, Number(b.slice(8, 10)));
  return Math.round((tb - ta) / 86_400_000);
}

/** The date a bill due on `dueDay` falls on in a month (clamped to the month's last day). */
export function dueDateIn(key: string, dueDay: number): string {
  return `${key}-${pad2(Math.min(dueDay, daysInMonth(key)))}`;
}
