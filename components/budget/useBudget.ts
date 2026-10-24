"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BudgetData } from "@/lib/budget/model";
import { budgetReducer, type BudgetAction } from "@/lib/budget/reducer";
import { STORAGE_KEY, loadBudget, saveBudget } from "@/lib/budget/storage";

export interface BudgetStore {
  /** null until the saved budget has been read from this browser. */
  data: BudgetData | null;
  dispatch: (action: BudgetAction) => void;
  /** A problem reading or saving, shown to the user. */
  warning: string | null;
}

/** Budget state, saved to this browser on every change and kept in sync across tabs. */
export function useBudget(): BudgetStore {
  const [data, setData] = useState<BudgetData | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const skipSave = useRef(true);

  useEffect(() => {
    const loaded = loadBudget();
    skipSave.current = true;
    setData(loaded.data);
    setWarning(loaded.warning);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const fresh = loadBudget();
      skipSave.current = true;
      setData(fresh.data);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (data === null) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    // Save immediately so a quick reload or closed tab never loses the last change.
    if (!saveBudget(data)) {
      setWarning(
        "Your browser couldn't save your latest changes (storage may be full or turned off). Use Back up to keep a copy.",
      );
    }
  }, [data]);

  const dispatch = useCallback((action: BudgetAction) => {
    setData((prev) => (prev === null ? prev : budgetReducer(prev, action)));
  }, []);

  return { data, dispatch, warning };
}
