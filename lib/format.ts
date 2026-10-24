/** Display formatters. All guard against NaN, ±Infinity and negative zero. */

export const LOCALE = "en-US";
export const CURRENCY = "USD";

const PLACEHOLDER = "—";

function clean(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  return Object.is(value, -0) ? 0 : value;
}

const currencyCache = new Map<string, Intl.NumberFormat>();
function currencyFormatter(digits: number): Intl.NumberFormat {
  const key = String(digits);
  let f = currencyCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: CURRENCY,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    currencyCache.set(key, f);
  }
  return f;
}

/** $1,234.56. Values ≥ 1e15 use scientific notation so they never overflow the layout. */
export function formatCurrency(value: number, opts: { cents?: boolean } = {}): string {
  const v = clean(value);
  if (v === null) return PLACEHOLDER;
  const digits = opts.cents === false ? 0 : 2;
  const rounded = Math.round(v * 10 ** digits) / 10 ** digits;
  const safe = rounded === 0 ? 0 : rounded;
  if (Math.abs(safe) >= 1e15) {
    const sci = new Intl.NumberFormat(LOCALE, { notation: "scientific", maximumFractionDigits: 2 }).format(safe);
    return `${safe < 0 ? "−" : ""}$${sci.replace("-", "")}`;
  }
  return currencyFormatter(digits).format(safe);
}

/** Whole dollars, e.g. $609,985. */
export function formatCurrencyWhole(value: number): string {
  return formatCurrency(value, { cents: false });
}

/** Compact for chart axes: $1.2M, $350K. */
export function formatCurrencyCompact(value: number): string {
  const v = clean(value);
  if (v === null) return PLACEHOLDER;
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v === 0 ? 0 : v);
}

/** Decimal → percent string: 0.051162 → "5.12%". */
export function formatPercent(value: number, digits = 2): string {
  const v = clean(value);
  if (v === null) return PLACEHOLDER;
  const pct = v * 100;
  if (Math.abs(pct) >= 1e9) return `${new Intl.NumberFormat(LOCALE, { notation: "scientific", maximumFractionDigits: 2 }).format(pct)}%`;
  const rounded = Math.round(pct * 10 ** digits) / 10 ** digits;
  return `${new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(rounded === 0 ? 0 : rounded)}%`;
}

export function formatNumber(value: number, digits = 2): string {
  const v = clean(value);
  if (v === null) return PLACEHOLDER;
  const rounded = Math.round(v * 10 ** digits) / 10 ** digits;
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: digits }).format(rounded === 0 ? 0 : rounded);
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** 135 months → "11 years, 3 months". */
export function formatDuration(months: number): string {
  const v = clean(months);
  if (v === null || v < 0) return PLACEHOLDER;
  const total = Math.round(v);
  const years = Math.floor(total / 12);
  const rem = total % 12;
  if (years === 0) return plural(rem, "month");
  if (rem === 0) return plural(years, "year");
  return `${plural(years, "year")}, ${plural(rem, "month")}`;
}

/** Years with a fixed number of decimals: "9.00 years", "9.006 years". */
export function formatYears(years: number, digits = 2): string {
  const v = clean(years);
  if (v === null) return PLACEHOLDER;
  const text = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
  return `${text} ${v === 1 ? "year" : "years"}`;
}

/** ISO "2055-02-01" → "Feb 2055". */
export function formatMonthYear(iso: string | null | undefined): string {
  if (!iso) return PLACEHOLDER;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return PLACEHOLDER;
  return new Intl.DateTimeFormat(LOCALE, { month: "short", year: "numeric", timeZone: "UTC" }).format(d);
}

/** ISO → "Feb 1, 2055". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return PLACEHOLDER;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return PLACEHOLDER;
  return new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(d);
}

/** Formats a digit string with thousands separators while typing: "1234567.8" → "1,234,567.8". */
export function groupDigits(raw: string): string {
  const negative = raw.startsWith("-");
  const body = negative ? raw.slice(1) : raw;
  const [intPart = "", ...rest] = body.split(".");
  const grouped = intPart.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${grouped}${rest.length ? `.${rest.join("")}` : ""}`;
}

/** Parses user text ("$1,234.50", "5%") into a number; null when blank or invalid. */
export function parseNumber(text: string): number | null {
  const cleaned = text.replace(/[,$%\s]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
