import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/guide/",
  "/budget-planner/",
  "/calculators/compound-interest/",
  "/calculators/simple-interest/",
  "/calculators/loan/",
  "/calculators/mortgage/",
  "/calculators/debt-payoff/",
  "/calculators/savings-goal/",
  "/calculators/retirement/",
  "/calculators/rate-tools/",
  "/calculators/inflation/",
  "/calculators/cagr/",
  "/calculators/budget/",
];

for (const scheme of ["light", "dark"] as const) {
  test.describe(`accessibility (${scheme})`, () => {
    test.use({ colorScheme: scheme });
    for (const path of PAGES) {
      test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
        await page.goto(path);
        // Wait for charts (client-only) to mount, then open schedules so tables are audited too.
        await page.waitForLoadState("networkidle");
        for (const btn of await page.locator("button[aria-expanded='false']").all()) {
          if ((await btn.getAttribute("aria-controls")) !== null) await btn.click();
        }
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        const summary = results.violations.map(
          (v) =>
            `${v.id}: ${v.nodes
              .map((n) => n.target.join(" "))
              .slice(0, 3)
              .join(", ")}`,
        );
        expect(summary).toEqual([]);
      });
    }
  });
}

test.describe("accessibility (budget planner with data)", () => {
  for (const scheme of ["light", "dark"] as const) {
    test(`all planner tabs have no WCAG A/AA violations (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/budget-planner/");
      await page.getByRole("button", { name: "Try it with sample data" }).click();
      for (const tab of ["Overview", "Plan", "Transactions", "Bills", "Goals"]) {
        await page.getByRole("tab", { name: tab }).click();
        await page.waitForTimeout(300);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        const summary = results.violations.map(
          (v) =>
            `${tab} ${v.id}: ${v.nodes
              .map((n) => n.target.join(" "))
              .slice(0, 3)
              .join(", ")}`,
        );
        expect(summary).toEqual([]);
      }
    });
  }
});
