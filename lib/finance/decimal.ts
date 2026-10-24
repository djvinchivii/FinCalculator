import Decimal from "decimal.js";

/** Shared Decimal constructor with enough precision for long compounding chains. */
export const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
export type Dec = InstanceType<typeof D>;

export const ZERO = new D(0);
export const ONE = new D(1);

/** Round to whole cents (half-up). */
export function cents(value: Decimal.Value): Dec {
  return new D(value).toDecimalPlaces(2, D.ROUND_HALF_UP);
}

/** Convert a Decimal to a JS number for display/charting only. */
export function num(value: Dec): number {
  const n = value.toNumber();
  return Object.is(n, -0) ? 0 : n;
}
