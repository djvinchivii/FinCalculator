import { expect, test } from "@playwright/test";
import { choose, expectHeadline, expectNoBadNumbers, fill, open, toggle } from "./helpers";
import { projectRetirement } from "../../lib/finance/retirement";
import { formatCurrency } from "../../lib/format";

test.describe("hub", () => {
  test("lists every calculator grouped by level", async ({ page }) => {
    await page.goto("/");
    for (const group of ["Basics", "Building Wealth", "Debt & Borrowing", "Long Game"]) {
      await expect(page.getByRole("heading", { name: group, level: 2 })).toBeVisible();
    }
    await expect(page.locator("#calculators a")).toHaveCount(11);
    await page.getByRole("link", { name: /Compound Interest/ }).click();
    await expect(page).toHaveURL(/compound-interest/);
  });
});

test.describe("compound interest", () => {
  test("#1 $10,000 at 5% monthly for 10 years", async ({ page }) => {
    await open(page, "compound-interest");
    await fill(page, "Initial deposit", "10000");
    await fill(page, "Recurring contribution", "0");
    await fill(page, "Annual interest rate", "5");
    await choose(page, "Compounding frequency", "12");
    await fill(page, "Years", "10");
    await expectHeadline(page, "$16,470.09");
    await expect(page.getByLabel("Initial deposit", { exact: true })).toHaveValue("10,000");
  });

  test("#2 $500/month annuity at 7% for 30 years", async ({ page }) => {
    await open(page, "compound-interest");
    await fill(page, "Initial deposit", "0");
    await fill(page, "Recurring contribution", "500");
    await fill(page, "Annual interest rate", "7");
    await fill(page, "Years", "30");
    await expectHeadline(page, "$609,985.50");
  });

  test("share URL round-trips", async ({ page }) => {
    await open(page, "compound-interest");
    await fill(page, "Initial deposit", "10000");
    await fill(page, "Recurring contribution", "0");
    await fill(page, "Annual interest rate", "5");
    await fill(page, "Years", "10");
    await expectHeadline(page, "$16,470.09");
    await expect(page).toHaveURL(/annualRate=5/);
    const url = page.url();
    await page.goto("/");
    await page.goto(url);
    await expectHeadline(page, "$16,470.09");
    await expect(page.getByLabel("Annual interest rate", { exact: true })).toHaveValue("5");
  });

  test("blank and huge inputs never show NaN or Infinity", async ({ page }) => {
    await open(page, "compound-interest");
    await fill(page, "Initial deposit", "");
    await expect(page.getByText("Enter a number")).toBeVisible();
    await expectNoBadNumbers(page);
    await fill(page, "Initial deposit", "999999999999");
    await fill(page, "Annual interest rate", "100");
    await choose(page, "Compounding frequency", "365");
    await fill(page, "Years", "100");
    await expect(page.getByTestId("headline")).not.toHaveText(/NaN|Infinity/);
    await expectNoBadNumbers(page);
    await fill(page, "Annual interest rate", "150");
    await expect(page.getByText("Rates are capped at 100%")).toBeVisible();
  });
});

test("simple interest: #10 $1,000 at 5% for 3 years", async ({ page }) => {
  await open(page, "simple-interest");
  await fill(page, "Principal", "1000");
  await fill(page, "Annual interest rate", "5");
  await fill(page, "Time", "3");
  await toggle(page, "Time unit", "Years");
  await expectHeadline(page, "$150.00");
});

test.describe("loan", () => {
  test("#3 $200,000 at 6% for 30 years", async ({ page }) => {
    await open(page, "loan");
    await fill(page, "Loan amount", "200000");
    await fill(page, "Annual interest rate", "6");
    await fill(page, "Loan term", "30");
    await expectHeadline(page, "$1,199.10");
    await expect(page.getByText("$231,677.04")).toBeVisible();
  });

  test("#5 zero-rate loan", async ({ page }) => {
    await open(page, "loan");
    await fill(page, "Loan amount", "12000");
    await fill(page, "Annual interest rate", "0");
    await fill(page, "Loan term", "12");
    await toggle(page, "Term unit", "Months");
    await expectHeadline(page, "$1,000.00");
    await expect(page.getByText("$0.00", { exact: true }).first()).toBeVisible();
  });

  test("extra payments show savings and the schedule exports", async ({ page }) => {
    await open(page, "loan");
    await fill(page, "Extra with every payment", "200");
    await expect(page.getByText("Interest saved")).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe("loan-amortization-schedule.csv");
  });
});

test("mortgage: P&I plus escrow costs", async ({ page }) => {
  await open(page, "mortgage");
  await fill(page, "Home price", "250000");
  await fill(page, "Down payment", "20");
  await fill(page, "Interest rate", "6");
  await fill(page, "Loan term", "30");
  await fill(page, "Property tax (annual)", "0");
  await fill(page, "Homeowners insurance (annual)", "0");
  await fill(page, "HOA dues (monthly)", "0");
  await expectHeadline(page, "$1,199.10");
  await expect(page.getByText("Not required")).toBeVisible();
});

test("debt payoff: #12 payment below interest is never paid off", async ({ page }) => {
  await open(page, "debt-payoff");
  await page.getByRole("button", { name: "Remove debt 3" }).click();
  await page.getByRole("button", { name: "Remove debt 2" }).click();
  await fill(page, "Balance", "1000");
  await fill(page, "APR", "24");
  await fill(page, "Minimum payment", "15");
  await fill(page, "Monthly budget for debt", "15");
  await expectHeadline(page, "Never paid off");
  await expect(page.getByRole("alert").filter({ hasText: "never be paid off" }).first()).toBeVisible();
});

test("savings goal: zero-rate contribution", async ({ page }) => {
  await open(page, "savings-goal");
  await fill(page, "Savings goal", "12000");
  await fill(page, "Current savings", "0");
  await fill(page, "Annual interest rate", "0");
  await fill(page, "Years to goal", "1");
  await expectHeadline(page, "$1,000.00");
  await page.getByRole("tab", { name: "How long it takes" }).click();
  await fill(page, "Contribution each month", "1000");
  await expectHeadline(page, "1 year");
});

test("retirement: projected nest egg", async ({ page }) => {
  await open(page, "retirement");
  await fill(page, "Current age", "30");
  await fill(page, "Retirement age", "60");
  await fill(page, "Current retirement savings", "0");
  await fill(page, "Monthly contribution", "500");
  await fill(page, "Return before retirement", "7");
  const expected = projectRetirement({
    currentAge: 30,
    retirementAge: 60,
    currentSavings: 0,
    monthlyContribution: 500,
    preReturn: 0.07,
    postReturn: 0.05,
    inflation: 0.03,
    annualSpending: 50_000,
    withdrawalRate: 0.04,
  });
  await expectHeadline(page, formatCurrency(expected.nestEgg, { cents: false }));
});

test("rate tools: #6 APR→APY and #7 doubling time", async ({ page }) => {
  await open(page, "rate-tools");
  await fill(page, "APR (nominal annual rate)", "5");
  await choose(page, "Compounding frequency", "12");
  await expectHeadline(page, "5.1162%");
  await fill(page, "Annual return", "8");
  await expect(page.getByTestId("rule72")).toHaveText("9.00 years");
  await expect(page.getByTestId("exact-doubling")).toHaveText("9.006 years");
});

test("inflation: #8 future cost and #9 Fisher real return", async ({ page }) => {
  await open(page, "inflation");
  await fill(page, "Amount", "100");
  await fill(page, "Annual inflation rate", "3");
  await fill(page, "Years", "10");
  await fill(page, "Nominal investment return", "7");
  await expectHeadline(page, "$134.39");
  await expect(page.getByText("3.8835%", { exact: true })).toBeVisible();
});

test("CAGR: #11 $1,000 → $2,000 in 5 years", async ({ page }) => {
  await open(page, "cagr");
  await fill(page, "Starting value", "1000");
  await fill(page, "Ending value", "2000");
  await fill(page, "Years", "5");
  await expectHeadline(page, "14.87%");
});

test("budget: 50/30/20 split and emergency fund", async ({ page }) => {
  await open(page, "budget");
  await fill(page, "Monthly take-home pay", "5000");
  await expectHeadline(page, "$2,500 / $1,500 / $1,000");
  await fill(page, "Essential monthly expenses", "3000");
  await fill(page, "Months of expenses to cover", "6");
  await expectHeadline(page, "$18,000", "headline-emergency");
  await fill(page, "Savings", "30");
  await expect(page.getByText(/must total 100%/)).toBeVisible();
});

test("dark mode toggle switches theme", async ({ page }) => {
  await page.goto("/");
  const toggleBtn = page.getByRole("button", { name: /Color theme/ });
  await toggleBtn.click(); // system → light
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await toggleBtn.click(); // light → dark
  await expect(page.locator("html")).toHaveClass(/dark/);
});
