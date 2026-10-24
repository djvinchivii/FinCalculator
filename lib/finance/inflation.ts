import { D, num } from "./decimal";

/** Future cost of something that costs `presentValue` today: PV(1 + i)^t. */
export function futureCost(presentValue: number, inflation: number, years: number): number {
  return num(new D(presentValue).times(new D(inflation).plus(1).pow(years)));
}

/** What `amount` future dollars are worth in today's money: amount / (1 + i)^t. */
export function purchasingPower(amount: number, inflation: number, years: number): number {
  return num(new D(amount).div(new D(inflation).plus(1).pow(years)));
}

/** Fisher real return: (1 + nominal) / (1 + inflation) − 1. */
export function realReturn(nominal: number, inflation: number): number {
  return num(new D(nominal).plus(1).div(new D(inflation).plus(1)).minus(1));
}

export interface InflationRow {
  year: number;
  futureCost: number;
  purchasingPower: number;
}

export function inflationSeries(amount: number, inflation: number, years: number): InflationRow[] {
  const rows: InflationRow[] = [];
  const whole = Math.max(0, Math.floor(years));
  for (let y = 0; y <= whole; y++) {
    rows.push({
      year: y,
      futureCost: futureCost(amount, inflation, y),
      purchasingPower: purchasingPower(amount, inflation, y),
    });
  }
  if (years > whole) {
    rows.push({
      year: years,
      futureCost: futureCost(amount, inflation, years),
      purchasingPower: purchasingPower(amount, inflation, years),
    });
  }
  return rows;
}
