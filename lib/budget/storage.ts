/** Saves the budget in this browser only (localStorage). Nothing is sent to a server. */
import { emptyBudget, parseBudget, type BudgetData } from "./model";

export const STORAGE_KEY = "fincalculator.budget.v1";

export type LoadResult = { data: BudgetData; warning: string | null };

export function loadBudget(): LoadResult {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: emptyBudget(), warning: null };
    const parsed = parseBudget(JSON.parse(raw) as unknown);
    if (parsed.ok) return { data: parsed.data, warning: null };
    return {
      data: emptyBudget(),
      warning: "We couldn't read your saved budget, so we started a fresh one.",
    };
  } catch {
    return {
      data: emptyBudget(),
      warning:
        "Your browser isn't letting this page save data (for example in private browsing). Use Back up to keep a copy.",
    };
  }
}

/** Returns false if the browser refused to save (storage full or disabled). */
export function saveBudget(data: BudgetData): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearBudget(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}
