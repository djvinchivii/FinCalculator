# Contributing

## Ground rules

- **Math lives in `lib/finance/`** as pure functions with zero React imports. Use `decimal.js` (via `lib/finance/decimal.ts`) for any running money total.
- **Every formula needs tests** in `tests/unit/finance/`: at least one known-value case, a zero-rate case, and a property test if there's an invariant (balances never go negative, totals add up, and so on).
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` and `npm run test:e2e` must all pass. No `any`.

## Adding a calculator

Say you're adding a "Car Lease" calculator at `/calculators/car-lease`.

1. **Math.** Create `lib/finance/lease.ts` with pure input → result functions, export it from `lib/finance/index.ts`, and add tests in `tests/unit/finance/`.

2. **Register it.** Add an entry to `CALCULATORS` in `lib/calculators.ts` (slug, title, short blurb, description, group, icon), then add the slug to the right group's `slugs` array in `GROUPS` to place it on the hub.

3. **Build the component.** Create `components/calculators/CarLease.tsx`, using an existing calculator such as `SimpleInterest.tsx` as a template:

   ```tsx
   "use client";

   const schema = z.object({
     price: money(),
     rate: percent(),
     months: numberText({ min: 1, max: 120 }),
   });
   type Form = z.input<typeof schema>; // what the fields hold (strings)
   type Inputs = z.output<typeof schema>; // what the math gets (numbers, rates as decimals)

   const defaults: Form = { price: "35,000", rate: "6", months: "36" };
   const compute = (v: Inputs) => lease(v); // module-level, so it stays stable

   export default function CarLease() {
     const { form, result, inputs, isStale, getShareUrl } = useCalculator(
       schema,
       defaults,
       compute,
     );
     return (
       <CalculatorPanels
         form={form}
         isStale={isStale}
         inputs={
           <MoneyField
             name="price"
             label="Vehicle price"
             tooltip="One sentence defining the term."
           />
         }
         results={result && inputs && <ResultSummary headlineLabel="…" headline="…" summary="…" />}
       />
     );
   }
   ```

   `useCalculator` gives you the 150 ms debounced live results, inline zod errors, and URL ⇄ state sync for free. Keep `schema`, `defaults` and `compute` at module level. If a default depends on today's date, pass a fourth `clientDefaults` function instead of computing it in `defaults` (see `Loan.tsx`), so server and client HTML match.

4. **Wire the route.** Add `"car-lease": dynamic(() => import("./CarLease"))` to `components/calculators/registry.ts`. The `[slug]` page and static export pick it up automatically.

5. **Explainer.** Add `content/explainers/car-lease.md` with four sections: _What it is_, _The formula_, _Worked example_ (check the numbers against your function) and _A common mistake_.

6. **Smoke test.** Add a case to `tests/e2e/calculators.spec.ts` that types a known input and asserts the `headline` text, and add the slug to `PAGES` in `tests/e2e/a11y.spec.ts` and `SLUGS` in `tests/e2e/fuzz.spec.ts`.

`tests/unit/registry.test.ts` fails if a calculator is missing its hub group, component or explainer.

## UI checklist

- [ ] Each input has a visible label and an ⓘ tooltip that defines the term in one sentence.
- [ ] A large headline result, 2–3 supporting numbers, and a plain-English summary built from the results.
- [ ] A chart (with the built-in data-table fallback) and a schedule table with CSV export where relevant.
- [ ] Share link and Copy results buttons.
- [ ] Works at 375 px with no horizontal scroll, in light and dark mode, and by keyboard alone.
