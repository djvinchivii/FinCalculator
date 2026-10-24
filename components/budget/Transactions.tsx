"use client";

import { useMemo, useState } from "react";
import {
  BUDGET_GROUPS,
  GROUP_INFO,
  newId,
  type BudgetData,
  type Transaction,
} from "@/lib/budget/model";
import { sum, transactionsInMonth } from "@/lib/budget/calc";
import { daysInMonth, monthKeyOf, monthLabel } from "@/lib/budget/dates";
import type { BudgetAction } from "@/lib/budget/reducer";
import { formatCurrency, formatDate } from "@/lib/format";
import { downloadCsv, toCsv, type CsvColumn } from "@/lib/csv";
import { Toggle } from "@/components/ui/Toggle";
import { MoneyInput, Panel, dangerBtn, inputCls, primaryBtn, signedMoney, smallBtn } from "./ui";

interface Draft {
  id: string | null;
  type: "expense" | "income";
  amount: number;
  date: string;
  categoryId: string;
  note: string;
}

function defaultDate(monthKey: string, today: string): string {
  if (monthKeyOf(today) === monthKey) return today;
  return `${monthKey}-01`;
}

export function transactionCsvColumns(data: BudgetData): CsvColumn<Transaction>[] {
  const cat = (id: string | null) => data.categories.find((c) => c.id === id);
  return [
    { header: "Date", value: (t) => t.date },
    { header: "Type", value: (t) => (t.type === "income" ? "Income" : "Expense") },
    {
      header: "Category",
      value: (t) => (t.type === "income" ? "" : (cat(t.categoryId)?.name ?? "Uncategorized")),
    },
    {
      header: "Group",
      value: (t) => {
        const c = t.type === "expense" ? cat(t.categoryId) : undefined;
        return c ? GROUP_INFO[c.group].label : "";
      },
    },
    { header: "Amount", value: (t) => (t.type === "income" ? t.amount : -t.amount) },
    { header: "Note", value: (t) => t.note },
  ];
}

export function Transactions({
  data,
  monthKey,
  today,
  dispatch,
}: {
  data: BudgetData;
  monthKey: string;
  today: string;
  dispatch: (a: BudgetAction) => void;
}) {
  const blank = (): Draft => ({
    id: null,
    type: "expense",
    amount: 0,
    date: defaultDate(monthKey, today),
    categoryId: data.categories[0]?.id ?? "",
    note: "",
  });
  const [draft, setDraft] = useState<Draft>(blank);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const catName = (id: string | null) =>
    data.categories.find((c) => c.id === id)?.name || "Uncategorized";

  const monthTx = useMemo(
    () =>
      transactionsInMonth(data.transactions, monthKey).sort(
        (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
      ),
    [data.transactions, monthKey],
  );
  const shown = monthTx.filter((t) => {
    if (filter === "income" && t.type !== "income") return false;
    if (
      filter === "uncategorized" &&
      !(
        t.type === "expense" &&
        (t.categoryId === null || !data.categories.some((c) => c.id === t.categoryId))
      )
    )
      return false;
    if (
      filter !== "all" &&
      filter !== "income" &&
      filter !== "uncategorized" &&
      t.categoryId !== filter
    )
      return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return t.note.toLowerCase().includes(q) || catName(t.categoryId).toLowerCase().includes(q);
    }
    return true;
  });
  const spent = sum(monthTx.filter((t) => t.type === "expense").map((t) => t.amount));
  const received = sum(monthTx.filter((t) => t.type === "income").map((t) => t.amount));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.amount <= 0) return setError("Enter an amount above $0.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return setError("Pick a date.");
    const tx: Transaction = {
      id: draft.id ?? newId("tx"),
      date: draft.date,
      type: draft.type,
      amount: draft.amount,
      categoryId: draft.type === "expense" && draft.categoryId ? draft.categoryId : null,
      note: draft.note.trim().slice(0, 140),
    };
    dispatch({ type: "saveTransaction", tx });
    setError(null);
    setSavedMsg(
      draft.id
        ? "Changes saved."
        : `Added ${formatCurrency(tx.amount)}${monthKeyOf(tx.date) !== monthKey ? ` to ${monthLabel(monthKeyOf(tx.date))}` : ""}.`,
    );
    setDraft({ ...blank(), type: draft.type, date: draft.date, categoryId: draft.categoryId });
  };

  const edit = (t: Transaction) => {
    setDraft({
      id: t.id,
      type: t.type,
      amount: t.amount,
      date: t.date,
      categoryId: t.categoryId ?? "",
      note: t.note,
    });
    setSavedMsg(null);
    document.getElementById("tx-amount")?.focus();
  };

  const [minDate, maxDate] = [
    `${monthKey}-01`,
    `${monthKey}-${String(daysInMonth(monthKey)).padStart(2, "0")}`,
  ];
  const columns = transactionCsvColumns(data);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
      <Panel title={draft.id ? "Edit transaction" : "Add a transaction"} id="tx-form-h">
        <form onSubmit={submit} noValidate className="space-y-4">
          <Toggle
            label="Type"
            name="tx-type"
            value={draft.type}
            onChange={(v) => setDraft({ ...draft, type: v as Draft["type"] })}
            options={[
              { value: "expense", label: "Money out" },
              { value: "income", label: "Money in" },
            ]}
          />
          <MoneyInput
            id="tx-amount"
            label="Amount"
            value={draft.amount}
            onChange={(amount) => setDraft({ ...draft, amount })}
          />
          {draft.type === "expense" && (
            <div>
              <label htmlFor="tx-category" className="mb-1 block text-sm font-medium">
                Category
              </label>
              <select
                id="tx-category"
                className={inputCls}
                value={draft.categoryId}
                onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
              >
                <option value="">Uncategorized</option>
                {BUDGET_GROUPS.map((g) => {
                  const cats = data.categories.filter((c) => c.group === g);
                  if (cats.length === 0) return null;
                  return (
                    <optgroup key={g} label={GROUP_INFO[g].label}>
                      {cats.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || "Unnamed category"}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="tx-date" className="mb-1 block text-sm font-medium">
              Date
            </label>
            <input
              id="tx-date"
              type="date"
              className={inputCls}
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="tx-note" className="mb-1 block text-sm font-medium">
              Note <span className="font-normal text-ink-muted">(optional)</span>
            </label>
            <input
              id="tx-note"
              className={inputCls}
              maxLength={140}
              value={draft.note}
              placeholder={draft.type === "expense" ? "e.g. Weekly groceries" : "e.g. Paycheck"}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={primaryBtn}>
              {draft.id ? "Save changes" : draft.type === "expense" ? "Add expense" : "Add income"}
            </button>
            {draft.id && (
              <button type="button" className={smallBtn} onClick={() => setDraft(blank())}>
                Cancel
              </button>
            )}
          </div>
          <p role="status" className="min-h-[1.25rem] text-sm text-brand-strong dark:text-brand">
            {savedMsg}
          </p>
        </form>
      </Panel>

      <Panel
        title={`${monthLabel(monthKey)} activity`}
        id="tx-list-h"
        actions={
          <>
            <button
              type="button"
              className={smallBtn}
              disabled={monthTx.length === 0}
              onClick={() =>
                downloadCsv(
                  `budget-transactions-${monthKey}`,
                  toCsv([...monthTx].reverse(), columns),
                )
              }
            >
              ⬇️ Export month (CSV)
            </button>
            <button
              type="button"
              className={smallBtn}
              disabled={data.transactions.length === 0}
              onClick={() =>
                downloadCsv(
                  "budget-transactions-all",
                  toCsv(
                    [...data.transactions].sort((a, b) => a.date.localeCompare(b.date)),
                    columns,
                  ),
                )
              }
            >
              ⬇️ Export all
            </button>
          </>
        }
      >
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-surface-2 p-3">
            <p className="text-xs text-ink-muted">Money out</p>
            <p className="font-semibold tabular-nums">{formatCurrency(spent)}</p>
          </div>
          <div className="rounded-lg bg-surface-2 p-3">
            <p className="text-xs text-ink-muted">Money in</p>
            <p className="font-semibold tabular-nums">{formatCurrency(received)}</p>
          </div>
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="tx-filter" className="mb-1 block text-sm font-medium">
              Show
            </label>
            <select
              id="tx-filter"
              className={inputCls}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Everything</option>
              <option value="income">Money in only</option>
              <option value="uncategorized">Uncategorized</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || "Unnamed category"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tx-search" className="mb-1 block text-sm font-medium">
              Search
            </label>
            <input
              id="tx-search"
              type="search"
              className={inputCls}
              value={query}
              placeholder="Note or category"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {monthTx.length === 0 ? (
          <p className="rounded-lg bg-surface-2 p-4 text-sm text-ink-muted">
            Nothing logged for {monthLabel(monthKey)} yet. Add your first purchase or paycheck with
            the form <span className="lg:hidden">above</span>
            <span className="hidden lg:inline">on the left</span>. Tip: logging as you go takes
            seconds and keeps your totals accurate.
          </p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-ink-muted">No transactions match.</p>
        ) : (
          <ul className="divide-y divide-border" aria-label="Transactions">
            {shown.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">
                    {t.note || (t.type === "income" ? "Income" : catName(t.categoryId))}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {formatDate(t.date)} ·{" "}
                    {t.type === "income" ? "Money in" : catName(t.categoryId)}
                  </p>
                </div>
                <p
                  className={`font-semibold tabular-nums ${t.type === "income" ? "text-brand-strong dark:text-brand" : "text-ink"}`}
                >
                  {signedMoney(t.type === "income" ? t.amount : -t.amount)}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={smallBtn}
                    onClick={() => edit(t)}
                    aria-label={`Edit ${t.note || "transaction"} on ${formatDate(t.date)}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={dangerBtn}
                    aria-label={`Delete ${t.note || "transaction"} on ${formatDate(t.date)}`}
                    onClick={() => {
                      if (window.confirm("Delete this transaction?"))
                        dispatch({ type: "removeTransaction", id: t.id });
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-ink-muted">
          Dates outside {monthLabel(monthKey)} ({formatDate(minDate)} – {formatDate(maxDate)}) are
          saved to their own month.
        </p>
      </Panel>
    </div>
  );
}
