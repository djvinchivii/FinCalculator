import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDuration,
  formatPercent,
  groupDigits,
  parseNumber,
} from "@/lib/format";
import { parseState, serializeState } from "@/lib/url-state";
import { toCsv } from "@/lib/csv";

describe("format", () => {
  it("never shows NaN, Infinity or negative zero", () => {
    expect(formatCurrency(NaN)).toBe("—");
    expect(formatCurrency(Infinity)).toBe("—");
    expect(formatCurrency(-0)).toBe("$0.00");
    expect(formatCurrency(-0.001)).toBe("$0.00");
    expect(formatPercent(-0.0000001)).toBe("0.00%");
    expect(formatCurrency(2.5e40)).not.toMatch(/NaN|Infinity/);
  });
  it("formats currency, percent and durations", () => {
    expect(formatCurrency(16470.0949)).toBe("$16,470.09");
    expect(formatPercent(0.0511619)).toBe("5.12%");
    expect(formatDuration(135)).toBe("11 years, 3 months");
    expect(formatDuration(12)).toBe("1 year");
  });
  it("groups digits while typing and parses user text", () => {
    expect(groupDigits("1234567.8")).toBe("1,234,567.8");
    expect(groupDigits("0012")).toBe("12");
    expect(parseNumber("$1,234.50")).toBe(1234.5);
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
  });
});

describe("url-state", () => {
  it("round-trips scalars and record arrays", () => {
    const defaults = { amount: "1000", on: false, debts: [{ name: "", balance: "" }] };
    const state = {
      amount: "250,000",
      on: true,
      debts: [
        { name: "Visa, gold", balance: "1200" },
        { name: "Car", balance: "9000" },
      ],
    };
    const parsed = parseState(new URLSearchParams(serializeState(state)), defaults);
    expect(parsed).toEqual(state);
  });
  it("falls back to defaults on malformed params", () => {
    const defaults = { debts: [{ name: "x" }], amount: "1" };
    expect(parseState(new URLSearchParams("debts=%7Bbad&other=1"), defaults)).toEqual(defaults);
  });
});

describe("csv", () => {
  it("escapes commas, quotes and formula prefixes", () => {
    const csv = toCsv(
      [
        { a: 'He said "hi", ok', b: 1.005 },
        { a: "=SUM(A1)", b: -0 },
      ],
      [
        { header: "Text", value: (r) => r.a },
        { header: "Num", value: (r) => r.b },
      ],
    );
    expect(csv).toBe('Text,Num\r\n"He said ""hi"", ok",1\r\n\'=SUM(A1),0\r\n');
  });
});
