/** Zod helpers that turn raw field text into validated numbers (with friendly inline errors). */
import { z } from "zod";
import { parseNumber } from "./format";
import { parseISODate } from "./finance/dates";
import type { Compounding, Frequency } from "./finance/rates";

export interface NumberTextOptions {
  min?: number;
  max?: number;
  /** Blank is allowed and treated as 0. */
  optional?: boolean;
  integer?: boolean;
  /** Value must be strictly greater than `min`. */
  exclusiveMin?: boolean;
  minMessage?: string;
  maxMessage?: string;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

export function numberText(opts: NumberTextOptions = {}) {
  return z.string().transform((text, ctx): number => {
    const trimmed = text.trim();
    if (trimmed === "") {
      if (opts.optional) return 0;
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a number" });
      return z.NEVER;
    }
    const n = parseNumber(trimmed);
    if (n === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid number" });
      return z.NEVER;
    }
    if (opts.min !== undefined && (opts.exclusiveMin ? n <= opts.min : n < opts.min)) {
      const message =
        opts.minMessage ??
        (opts.min === 0 ? (opts.exclusiveMin ? "Must be more than 0" : "Can’t be negative") : `Must be at least ${fmt(opts.min)}`);
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      return z.NEVER;
    }
    if (opts.max !== undefined && n > opts.max) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: opts.maxMessage ?? `Must be ${fmt(opts.max)} or less` });
      return z.NEVER;
    }
    if (opts.integer && !Number.isInteger(n)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Use a whole number" });
      return z.NEVER;
    }
    return n;
  });
}

export const MAX_MONEY = 1_000_000_000_000;

/** Dollar amount: 0 … $1 trillion. */
export const money = (opts: NumberTextOptions = {}) =>
  numberText({ min: 0, max: MAX_MONEY, maxMessage: "That’s more than $1 trillion — try a smaller amount", ...opts });

/** Percent text (e.g. "5") → decimal (0.05). Capped at 100%. */
export const percent = (opts: NumberTextOptions = {}) =>
  numberText({ min: 0, max: 100, maxMessage: "Rates are capped at 100%", ...opts }).transform((n) => n / 100);

/** Years: 0 … 100. */
export const years = (opts: NumberTextOptions = {}) =>
  numberText({ min: 0, max: 100, maxMessage: "Terms are capped at 100 years", ...opts });

export const isoDate = () =>
  z.string().refine((s) => parseISODate(s) !== null, { message: "Enter a valid date" });

export const compounding = () =>
  z
    .enum(["1", "2", "4", "12", "26", "52", "365", "continuous"])
    .transform((v): Compounding => (v === "continuous" ? "continuous" : (Number(v) as Compounding)));

export const frequency = () =>
  z.enum(["1", "2", "4", "12", "26", "52"]).transform((v) => Number(v) as Frequency);

export const timing = () => z.enum(["begin", "end"]);

export const toOptions = <T extends string | number>(opts: { value: T; label: string }[]) =>
  opts.map((o) => ({ value: String(o.value), label: o.label }));
