import { expect, type Page } from "@playwright/test";

export async function open(page: Page, slug: string, query = "") {
  await page.goto(`/calculators/${slug}/${query}`);
  await expect(page.getByTestId("headline")).toBeVisible();
}

/** Fills a labelled text field (exact label match, so sliders and ⓘ buttons are ignored). */
export async function fill(page: Page, label: string, value: string) {
  const input = page.getByLabel(label, { exact: true });
  await input.fill(value);
}

export async function choose(page: Page, label: string, value: string) {
  await page.getByLabel(label, { exact: true }).selectOption(value);
}

/** Clicks a segmented-control option inside the fieldset with the given legend. */
export async function toggle(page: Page, legend: string, option: string) {
  await page.getByRole("group", { name: legend }).getByText(option, { exact: true }).click();
}

export async function expectHeadline(page: Page, text: string, testId = "headline") {
  await expect(page.getByTestId(testId)).toHaveText(text);
}

export async function expectNoBadNumbers(page: Page) {
  const body = await page.locator("main").innerText();
  expect(body).not.toMatch(/NaN|Infinity|-\$0\.00|−\$0\.00|-0\.00%/);
}
