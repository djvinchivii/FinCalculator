"use client";

import { useRef, useState } from "react";
import { emptyBudget, parseBudget, type BudgetData } from "@/lib/budget/model";
import { localToday } from "@/lib/budget/dates";
import type { BudgetAction } from "@/lib/budget/reducer";
import { dangerBtn, smallBtn } from "./ui";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Back up / restore / delete — the budget lives only in this browser, so these matter. */
export function DataControls({
  data,
  dispatch,
}: {
  data: BudgetData;
  dispatch: (a: BudgetAction) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const restore = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ tone: "error", text: "That file is too large to be a budget backup." });
      return;
    }
    try {
      const parsed = parseBudget(JSON.parse(await file.text()) as unknown);
      if (!parsed.ok) {
        setMessage({ tone: "error", text: parsed.error });
        return;
      }
      if (window.confirm("Replace your current budget with this backup? This can't be undone.")) {
        dispatch({ type: "replace", data: { ...parsed.data, setupDone: true } });
        setMessage({ tone: "ok", text: "Backup restored." });
      }
    } catch {
      setMessage({ tone: "error", text: "This file isn't a valid budget backup." });
    }
  };

  return (
    <section
      aria-labelledby="data-h"
      className="rounded-card border border-border bg-surface-2 p-4 text-sm sm:p-5"
    >
      <h2 id="data-h" className="font-semibold text-ink">
        Your data
      </h2>
      <p className="mt-1 max-w-3xl text-ink-muted">
        <span aria-hidden="true">🔒 </span>
        Your budget is saved only in this browser on this device — nothing is sent to us. Clearing
        your browser data deletes it, so download a backup now and then. You can also use a backup
        to move your budget to another device.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={smallBtn}
          onClick={() => downloadJson(`fincalculator-budget-${localToday()}.json`, data)}
        >
          ⬇️ Download backup
        </button>
        <button type="button" className={smallBtn} onClick={() => fileRef.current?.click()}>
          ⬆️ Restore backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Choose a backup file to restore"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void restore(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className={dangerBtn}
          onClick={() => {
            if (
              window.confirm(
                "Delete your whole budget from this browser? Download a backup first if you want to keep it.",
              )
            ) {
              dispatch({ type: "replace", data: emptyBudget() });
              setMessage({ tone: "ok", text: "Your budget was deleted." });
            }
          }}
        >
          Delete all data
        </button>
      </div>
      <p
        role="status"
        className={`mt-2 min-h-[1.25rem] ${message?.tone === "error" ? "text-danger" : "text-brand-strong dark:text-brand"}`}
      >
        {message?.text}
      </p>
    </section>
  );
}
