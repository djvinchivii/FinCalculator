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

/** Clicks a button that triggers a download and returns the file's name and raw text. */
export async function downloadText(
  page: Page,
  click: () => Promise<void>,
): Promise<{ name: string; text: string }> {
  const [download] = await Promise.all([page.waitForEvent("download"), click()]);
  const path = await download.path();
  const fs = await import("node:fs/promises");
  return { name: download.suggestedFilename(), text: await fs.readFile(path, "utf8") };
}

/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const body = text.replace(/^﻿/, "");
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (quoted) {
      if (ch === '"' && body[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\r" && body[i + 1] === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i++;
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
