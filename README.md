# FinCalculator

A fast, mobile-first suite of accurate financial calculators — from a first budget to early retirement. Every calculator updates live as you type, explains its result in plain English, draws a chart, shows a full schedule where relevant, and can be shared by URL or exported to CSV.

No accounts, no backend, no tracking: it's a static site and all math runs in the browser.

| Level            | Calculators                                                                    |
| ---------------- | ------------------------------------------------------------------------------ |
| Basics           | Simple Interest · Inflation · Budget & Emergency Fund · APR ↔ APY & Rule of 72 |
| Building Wealth  | Compound Interest · Savings Goal · Investment Return (CAGR)                    |
| Debt & Borrowing | Loan & Amortization · Mortgage · Debt Payoff (Avalanche vs. Snowball)          |
| Long Game        | Retirement & FIRE                                                              |

## Quick start

Requires Node 20+.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command             | What it does                                                                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                                                                                                                                             |
| `npm run build`     | Static export to `out/` (deploy anywhere; Vercel works out of the box)                                                                                                 |
| `npm start`         | Serve the built `out/` folder locally on port 3000                                                                                                                     |
| `npm test`          | Unit tests (Vitest): test vectors, property tests, formatting, URL state, CSV                                                                                          |
| `npm run test:e2e`  | Playwright: one smoke test per calculator, accessibility (axe) in light and dark mode, and input fuzzing — at desktop and 375 px mobile widths. Builds the site first. |
| `npm run lint`      | ESLint (Next.js rules, `no-explicit-any` as an error, zero warnings allowed)                                                                                           |
| `npm run typecheck` | TypeScript `strict` check                                                                                                                                              |

The first time you run the e2e tests, install a browser: `npx playwright install chromium`.

## How it's built

- **Next.js (App Router) + TypeScript (strict)**, statically exported.
- **Tailwind CSS** with brand tokens in [tailwind.config.ts](tailwind.config.ts) and [app/globals.css](app/globals.css).
- **decimal.js** for all money math — no floating-point running totals.
- **zod + react-hook-form** for inputs and inline validation.
- **Recharts** for charts, loaded lazily when a chart scrolls into view.

```
app/                         routes: hub page and /calculators/[slug]
components/
  ui/                        Input, Select, Toggle, Slider, Card, Tabs, Tooltip, form-bound fields
  calculator/                CalculatorShell, panels, ResultSummary, ScheduleTable, Share/Copy/Export, Explainer, useCalculator
  calculators/               one component per calculator + registry.ts
  charts/                    GrowthChart, AmortizationChart, PayoffChart, BreakdownDonut
lib/
  finance/                   pure math (no React) — one file per domain
  format.ts                  currency, percent, duration formatters (Intl.NumberFormat)
  url-state.ts               inputs ⇄ query string
  csv.ts                     schedule → CSV (Excel/Sheets-friendly)
  schema.ts                  zod helpers that turn field text into validated numbers
  calculators.ts             calculator registry (titles, groups, hub order)
  site.ts                    site name, tagline and disclaimer
content/explainers/          one Markdown "What this means" explainer per calculator
tests/unit, tests/e2e        Vitest and Playwright suites
```

### Conventions

- Users type rates as percents (`5` = 5%); they become decimals at the schema boundary. Everything in `lib/finance` takes decimals.
- Full precision internally. Amortization rows (payment, interest, principal) are rounded to cents, and the final payment absorbs the rounding drift so the balance ends at exactly $0.00.
- Every formula that divides by a rate has a 0% branch.
- Validation caps rates at 100%, terms at 100 years and amounts at $1 trillion, and shows inline errors. Formatters never print `NaN`, `Infinity` or `-0`.
- The address bar always holds the current inputs, so any URL is a shareable, restorable state.

## Rename the site or change brand colors

- **Name, tagline, disclaimer:** edit [lib/site.ts](lib/site.ts).
- **Colors:** edit the CSS variables at the top of [app/globals.css](app/globals.css). `:root` is light mode and `.dark` is dark mode. Values are space-separated RGB channels (e.g. `--brand: 4 120 87;`) so Tailwind opacity modifiers keep working. `--chart-1` … `--chart-6` are the chart series colors.
- **Fonts:** set `--font-sans` / `--font-display` in the same file (they default to the system font stack, which keeps the site fast). To use a web font, load it with `next/font` in `app/layout.tsx` and point the variable at it.
- **Token names** (what components use, like `bg-brand` or `text-ink-muted`) live in [tailwind.config.ts](tailwind.config.ts).
- **Favicon:** [app/icon.svg](app/icon.svg).

After changing colors, run `npm run test:e2e` — the axe accessibility suite checks WCAG AA contrast in both themes.

## Add a new calculator

See [CONTRIBUTING.md](CONTRIBUTING.md#adding-a-calculator).

## Notes on accuracy

All calculators are verified against the published test vectors (see `tests/unit/finance/vectors.test.ts`) and property tests such as "amortization principal always sums to the loan" and "Avalanche never pays more interest than Snowball."

One documented nuance: a $200,000, 6%, 30-year loan's cent-rounded schedule ($1,199.10 × 359 plus a $1,200.14 final payment) totals **$231,677.04** in interest. The textbook figure of about $231,676 comes from the unrounded payment ($1,199.1010…) and is also asserted in the tests.

Results are educational estimates, not financial advice.
