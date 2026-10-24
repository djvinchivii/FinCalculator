import { expect, test, type Page } from "@playwright/test";
import { downloadText, parseCsv } from "./helpers";

async function freshPlanner(page: Page) {
  page.on("dialog", (d) => void d.accept());
  await page.goto("/budget-planner/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole("heading", { name: "Let's set up your budget" })).toBeVisible();
}

async function setUp(page: Page) {
  await freshPlanner(page);
  await page.getByLabel("Take-home pay per paycheck").fill("1850");
  await page.getByLabel("How often you're paid").selectOption("biweekly");
  await expect(page.getByText("That's about $4,008 a month")).toBeVisible();
  await page.getByRole("button", { name: "Create my budget" }).click();
  await expect(page.getByTestId("left-to-budget")).toHaveText("$0.00");
}

async function addExpense(page: Page, amount: string, category: string, note: string) {
  await page.getByRole("tab", { name: "Transactions" }).click();
  await page.getByLabel("Amount", { exact: true }).fill(amount);
  await page.getByLabel("Category").selectOption({ label: category });
  await page.getByLabel("Note").fill(note);
  await page.getByRole("button", { name: "Add expense" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Added" })).toBeVisible();
}

test("set up a budget, log spending, and it survives a reload", async ({ page }) => {
  await setUp(page);
  await addExpense(page, "86.40", "Groceries", "Weekly groceries");
  await addExpense(page, "1,080", "Rent or mortgage", "Rent");
  await expect(page.getByRole("list", { name: "Transactions" }).getByRole("listitem")).toHaveCount(
    2,
  );

  await page.getByRole("tab", { name: "Overview" }).click();
  await expect(page.getByTestId("spent-total")).toHaveText("$1,166.40");
  await expect(page.getByText("$4,008.33").first()).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("spent-total")).toHaveText("$1,166.40");
});

test("editing the plan updates what's left to budget", async ({ page }) => {
  await setUp(page);
  await page.getByRole("tab", { name: "Plan" }).click();
  const groceries = page.locator("li").filter({ has: page.locator('input[value="Groceries"]') });
  await groceries.getByLabel("Monthly plan").fill("460");
  await page.getByRole("tab", { name: "Overview" }).click();
  await expect(page.getByTestId("left-to-budget")).toHaveText("−$100.00");
  await expect(page.getByText(/spends \$100 more than you earn/)).toBeVisible();
});

test("over-budget warning, bills and goals", async ({ page }) => {
  await setUp(page);
  await addExpense(page, "500", "Eating out", "Big night out");
  await page.getByRole("tab", { name: "Overview" }).click();
  await expect(page.getByText(/Eating out is \$180 over budget/)).toBeVisible();

  await page.getByRole("tab", { name: "Bills" }).click();
  const rent = page.getByLabel(/Rent or mortgage/);
  await rent.check();
  await expect(rent).toBeChecked();

  await page.getByRole("tab", { name: "Goals" }).click();
  await page.getByRole("button", { name: "Add emergency fund" }).click();
  await page.getByLabel("Add money to Emergency fund").fill("250");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByLabel("Saved", { exact: true })).toHaveValue("250");
});

test("transactions export to a clean CSV", async ({ page, isMobile }) => {
  test.skip(isMobile, "downloads are checked on desktop");
  await setUp(page);
  await addExpense(page, "86.40", "Groceries", 'Snacks, "party" size');
  await page.getByRole("radio", { name: "Money in" }).check({ force: true });
  await page.getByLabel("Amount", { exact: true }).fill("1850");
  await page.getByLabel("Note").fill("Paycheck");
  await page.getByRole("button", { name: "Add income" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Added $1,850.00" })).toBeVisible();

  const { name, text } = await downloadText(page, () =>
    page.getByRole("button", { name: /Export month/ }).click(),
  );
  expect(name).toMatch(/^budget-transactions-\d{4}-\d{2}\.csv$/);
  expect(text.charCodeAt(0)).toBe(0xfeff);
  const rows = parseCsv(text);
  expect(rows[0]).toEqual(["Date", "Type", "Category", "Group", "Amount", "Note"]);
  const body = rows.slice(1);
  expect(body).toHaveLength(2);
  expect(body).toContainEqual([
    expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    "Expense",
    "Groceries",
    "Needs",
    "-86.4",
    'Snacks, "party" size',
  ]);
  expect(body).toContainEqual([
    expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    "Income",
    "",
    "",
    "1850",
    "Paycheck",
  ]);
});

test("back up, delete and restore", async ({ page, isMobile }) => {
  test.skip(isMobile, "file round-trip is checked on desktop");
  await setUp(page);
  await addExpense(page, "42", "Shopping", "Gift");
  const backup = await downloadText(page, () =>
    page.getByRole("button", { name: /Download backup/ }).click(),
  );
  expect(backup.name).toMatch(/^fincalculator-budget-.*\.json$/);
  expect(JSON.parse(backup.text).transactions).toHaveLength(1);

  await page.getByRole("button", { name: "Delete all data" }).click();
  await expect(page.getByRole("heading", { name: "Let's set up your budget" })).toBeVisible();
  await page.getByRole("button", { name: "Start from scratch" }).click();
  await page.getByLabel("Choose a backup file to restore").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(backup.text),
  });
  await expect(page.getByText("Backup restored.")).toBeVisible();
  await expect(page.getByTestId("spent-total")).toHaveText("$42.00");

  await page.getByLabel("Choose a backup file to restore").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"hello":"world"}'),
  });
  await expect(page.getByText("This file isn't a valid budget backup.")).toBeVisible();
});

test("sample data can be explored and then replaced", async ({ page }) => {
  await freshPlanner(page);
  await page.getByRole("button", { name: "Try it with sample data" }).click();
  await expect(page.getByText("You're looking at sample data.")).toBeVisible();
  await expect(page.getByTestId("left-to-budget")).toHaveText("$0.00");
  await page.getByRole("button", { name: "Start my own budget" }).click();
  await expect(page.getByRole("heading", { name: "Let's set up your budget" })).toBeVisible();
});

test("month navigation", async ({ page }) => {
  await setUp(page);
  const label = page.getByTestId("month-label");
  const current = await label.textContent();
  await page.getByRole("button", { name: "Previous month" }).click();
  await expect(label).not.toHaveText(current ?? "");
  await page.getByRole("button", { name: "Back to this month" }).click();
  await expect(label).toHaveText(current ?? "");
});
