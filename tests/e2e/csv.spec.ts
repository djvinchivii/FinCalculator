import { expect, test } from "@playwright/test";
import { downloadText, fill, open, parseCsv, toggle } from "./helpers";

test.skip(({ isMobile }) => isMobile, "downloads are checked once, on desktop");

/** Checks a CSV opens cleanly in Excel/Sheets: BOM, CRLF, rectangular rows, plain numbers. */
function expectCleanCsv(text: string, header: string[]) {
  expect(text.charCodeAt(0)).toBe(0xfeff);
  expect(text).toContain("\r\n");
  expect(text).not.toMatch(/NaN|Infinity|undefined|\$/);
  const rows = parseCsv(text);
  expect(rows[0]).toEqual(header);
  for (const r of rows) expect(r).toHaveLength(header.length);
  return rows.slice(1);
}

test("loan schedule CSV has every payment and ends at $0", async ({ page }) => {
  await open(page, "loan");
  await fill(page, "Loan amount", "200000");
  await fill(page, "Annual interest rate", "6");
  await fill(page, "Loan term", "30");
  await expect(page.getByTestId("headline")).toHaveText("$1,199.10");
  const { name, text } = await downloadText(page, () =>
    page.getByRole("button", { name: "Export CSV" }).click(),
  );
  expect(name).toBe("loan-amortization-schedule.csv");
  const rows = expectCleanCsv(text, [
    "Payment #",
    "Date",
    "Payment",
    "Principal",
    "Interest",
    "Extra principal",
    "Balance",
  ]);
  expect(rows).toHaveLength(360);
  expect(rows[0]?.[2]).toBe("1199.1");
  expect(rows[0]?.[4]).toBe("1000");
  expect(rows.at(-1)?.[6]).toBe("0");
  const totalInterest = rows.reduce((s, r) => s + Number(r[4]), 0);
  expect(totalInterest).toBeCloseTo(231_677.04, 1);
});

test("compound interest CSV matches the headline", async ({ page }) => {
  await open(page, "compound-interest");
  await fill(page, "Initial deposit", "10000");
  await fill(page, "Recurring contribution", "0");
  await fill(page, "Annual interest rate", "5");
  await fill(page, "Years", "10");
  await expect(page.getByTestId("headline")).toHaveText("$16,470.09");
  const { name, text } = await downloadText(page, () =>
    page.getByRole("button", { name: "Export CSV" }).click(),
  );
  expect(name).toBe("compound-interest-schedule.csv");
  const rows = expectCleanCsv(text, [
    "Year",
    "Contributions",
    "Interest",
    "Total contributed",
    "Total interest",
    "Balance",
    "Balance (today's dollars)",
  ]);
  expect(rows).toHaveLength(10);
  expect(rows.at(-1)?.[5]).toBe("16470.09");
});

const OTHERS: {
  slug: string;
  file: string;
  prepare?: (p: import("@playwright/test").Page) => Promise<void>;
}[] = [
  { slug: "mortgage", file: "mortgage-schedule.csv" },
  { slug: "debt-payoff", file: "debt-payoff-schedule.csv" },
  { slug: "savings-goal", file: "savings-goal-progress.csv" },
  { slug: "retirement", file: "retirement-projection.csv" },
  { slug: "inflation", file: "inflation-table.csv" },
  {
    slug: "cagr",
    file: "cagr-yearly-returns.csv",
    prepare: (p) => toggle(p, "Input", "Yearly values"),
  },
];

for (const c of OTHERS) {
  test(`${c.slug} CSV downloads with data`, async ({ page }) => {
    await open(page, c.slug);
    if (c.prepare) await c.prepare(page);
    const { name, text } = await downloadText(page, () =>
      page.getByRole("button", { name: "Export CSV" }).click(),
    );
    expect(name).toBe(c.file);
    const rows = parseCsv(text);
    expectCleanCsv(text, rows[0] ?? []);
    expect(rows.length).toBeGreaterThan(2);
  });
}

test("text with commas and quotes stays in one cell", async ({ page }) => {
  await open(page, "debt-payoff");
  await page.getByLabel("Name", { exact: true }).first().fill('Visa "Gold", rewards');
  // Wait for the live (debounced) results to pick up the new name before exporting.
  await expect(page.getByText(/Visa "Gold", rewards/).first()).toBeVisible();
  const { text } = await downloadText(page, () =>
    page.getByRole("button", { name: "Export CSV" }).click(),
  );
  const rows = parseCsv(text);
  expect(rows[0]).toContain('Visa "Gold", rewards');
});
