/**
 * Serializes calculator inputs to a query string and back.
 *
 * Calculator form state is made of strings (raw field text), booleans, and arrays of
 * string records (e.g. a list of debts). Scalars are written as-is; arrays/objects as JSON.
 * Parsing is driven by the defaults object, so unknown or malformed params fall back safely.
 */

export type UrlValue = string | boolean | number | UrlRecord[] | string[];
export type UrlRecord = Record<string, string>;
export type UrlState = Record<string, UrlValue>;

export function serializeState(state: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "boolean") params.set(key, value ? "1" : "0");
    else if (typeof value === "string" || typeof value === "number") params.set(key, String(value));
    else params.set(key, JSON.stringify(value));
  }
  return params.toString();
}

function isStringRecord(value: unknown): value is UrlRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => typeof v === "string")
  );
}

export function parseState<T extends object>(params: URLSearchParams, defaults: T): T {
  const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const [key, fallback] of Object.entries(defaults)) {
    const raw = params.get(key);
    if (raw === null) continue;
    if (typeof fallback === "boolean") {
      out[key] = raw === "1" || raw === "true";
    } else if (typeof fallback === "number") {
      const n = Number(raw);
      if (Number.isFinite(n)) out[key] = n;
    } else if (typeof fallback === "string") {
      out[key] = raw.slice(0, 200);
    } else if (Array.isArray(fallback)) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length > 50) continue;
        const template = fallback[0];
        if (
          typeof template === "string" ||
          (fallback.length === 0 && parsed.every((p) => typeof p === "string"))
        ) {
          if (parsed.every((p) => typeof p === "string")) out[key] = parsed;
        } else if (parsed.every(isStringRecord)) {
          out[key] =
            template && isStringRecord(template)
              ? parsed.map((p) => ({ ...template, ...pick(p, Object.keys(template)) }))
              : parsed;
        }
      } catch {
        // ignore malformed JSON and keep the default
      }
    }
  }
  return out as T;
}

function pick(record: UrlRecord, keys: string[]): UrlRecord {
  const out: UrlRecord = {};
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "string") out[k] = v.slice(0, 200);
  }
  return out;
}

/** Builds a full shareable URL for the current page with the given state. */
export function buildShareUrl(state: object, base?: string): string {
  const origin =
    base ??
    (typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "");
  const qs = serializeState(state);
  return qs ? `${origin}?${qs}` : origin;
}
