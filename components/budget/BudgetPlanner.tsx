"use client";

import { useEffect, useMemo, useState } from "react";
import { billsForMonth, budgetInsights, summarizeMonth } from "@/lib/budget/calc";
import { localToday, monthKeyOf, monthLabel, shiftMonth } from "@/lib/budget/dates";
import { emptyBudget } from "@/lib/budget/model";
import { Tabs } from "@/components/ui/Tabs";
import { Alert } from "@/components/calculator/ResultSummary";
import { useBudget } from "./useBudget";
import { Onboarding } from "./Onboarding";
import { Overview } from "./Overview";
import { PlanEditor } from "./PlanEditor";
import { Transactions } from "./Transactions";
import { Bills } from "./Bills";
import { Goals } from "./Goals";
import { DataControls } from "./DataControls";
import { smallBtn } from "./ui";

type Tab = "overview" | "plan" | "transactions" | "bills" | "goals";
const TABS: { value: Tab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "plan", label: "Plan" },
  { value: "transactions", label: "Transactions" },
  { value: "bills", label: "Bills" },
  { value: "goals", label: "Goals" },
];

export default function BudgetPlanner() {
  const { data, dispatch, warning } = useBudget();
  const [tab, setTab] = useState<Tab>("overview");
  const [today, setToday] = useState<string | null>(null);
  const [monthKey, setMonthKey] = useState<string | null>(null);

  useEffect(() => {
    const t = localToday();
    setToday(t);
    setMonthKey(monthKeyOf(t));
  }, []);

  const ready = data !== null && today !== null && monthKey !== null;
  const summary = useMemo(
    () => (ready ? summarizeMonth(data, monthKey, today) : null),
    [ready, data, monthKey, today],
  );
  const bills = useMemo(
    () => (ready ? billsForMonth(data, monthKey, today) : []),
    [ready, data, monthKey, today],
  );
  const insights = useMemo(
    () => (ready && summary ? budgetInsights(data, summary, bills) : []),
    [ready, data, summary, bills],
  );

  // Starting over (or restoring) should always land on the Overview.
  const setupDone = data?.setupDone ?? false;
  useEffect(() => {
    if (!setupDone) setTab("overview");
  }, [setupDone]);

  if (!ready || !summary) {
    return (
      <div
        role="status"
        className="h-64 animate-pulse rounded-card border border-border bg-surface"
      >
        <span className="sr-only">Loading your budget…</span>
      </div>
    );
  }

  if (!data.setupDone) {
    return (
      <div className="space-y-4">
        {warning && <Alert tone="warning">{warning}</Alert>}
        <Onboarding dispatch={dispatch} />
      </div>
    );
  }

  const isCurrent = monthKey === monthKeyOf(today);
  const goTo = (t: Tab) => {
    setTab(t);
    document.getElementById("planner-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      {warning && <Alert tone="warning">{warning}</Alert>}
      {data.isSample && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent/40 bg-accent/10 p-4 text-sm">
          <p>
            <strong>You&apos;re looking at sample data.</strong> Explore freely — when you&apos;re
            ready, start fresh with your own numbers.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={smallBtn}
              onClick={() => dispatch({ type: "replace", data: emptyBudget() })}
            >
              Start my own budget
            </button>
            <button
              type="button"
              className={smallBtn}
              onClick={() => dispatch({ type: "keepSampleAsMine" })}
            >
              Keep editing this one
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2" role="group" aria-label="Choose month">
          <button
            type="button"
            className={smallBtn}
            onClick={() => setMonthKey(shiftMonth(monthKey, -1))}
            aria-label="Previous month"
          >
            ←
          </button>
          <h2
            className="min-w-[10rem] text-center text-xl font-bold"
            aria-live="polite"
            data-testid="month-label"
          >
            {monthLabel(monthKey)}
          </h2>
          <button
            type="button"
            className={smallBtn}
            onClick={() => setMonthKey(shiftMonth(monthKey, 1))}
            aria-label="Next month"
          >
            →
          </button>
        </div>
        {!isCurrent && (
          <button type="button" className={smallBtn} onClick={() => setMonthKey(monthKeyOf(today))}>
            Back to this month
          </button>
        )}
      </div>

      <div id="planner-tabs" className="scroll-mt-20">
        <Tabs
          label="Budget sections"
          idPrefix="planner"
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          options={TABS}
        />
      </div>

      <div id="planner-panel" role="tabpanel" aria-labelledby={`planner-tab-${tab}`} tabIndex={-1}>
        {tab === "overview" && (
          <Overview summary={summary} bills={bills} insights={insights} onGoTo={goTo} />
        )}
        {tab === "plan" && <PlanEditor data={data} summary={summary} dispatch={dispatch} />}
        {tab === "transactions" && (
          <Transactions
            key={monthKey}
            data={data}
            monthKey={monthKey}
            today={today}
            dispatch={dispatch}
          />
        )}
        {tab === "bills" && (
          <Bills bills={bills} monthKey={monthKey} dispatch={dispatch} onGoTo={goTo} />
        )}
        {tab === "goals" && <Goals data={data} today={today} dispatch={dispatch} />}
      </div>

      <DataControls data={data} dispatch={dispatch} />
    </div>
  );
}
