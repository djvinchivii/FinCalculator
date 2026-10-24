import { expect, test } from "@playwright/test";

const SLUGS = [
  "compound-interest",
  "simple-interest",
  "loan",
  "mortgage",
  "debt-payoff",
  "savings-goal",
  "retirement",
  "rate-tools",
  "inflation",
  "cagr",
  "budget",
];
const VALUES = ["", "0", "999999999999", "0.0001", "100"];
const BAD = /NaN|Infinity|-\$0\.00|−\$0\.00|-0\.00%|undefined/;

test.describe("fuzzing inputs never shows NaN, Infinity or negative zero", () => {
  test.skip(({ isMobile }) => isMobile, "desktop is enough for the fuzz sweep");
  for (const slug of SLUGS) {
    test(slug, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`/calculators/${slug}/`);
      await expect(page.getByTestId("headline")).toBeVisible();
      const inputs = page.locator("form input[inputmode]");
      const count = await inputs.count();
      for (const value of VALUES) {
        for (let i = 0; i < count; i++) await inputs.nth(i).fill(value);
        await page.waitForTimeout(250);
        const text = await page.locator("main").innerText();
        expect(text, `value "${value}"`).not.toMatch(BAD);
      }
      expect(errors).toEqual([]);
    });
  }
});
