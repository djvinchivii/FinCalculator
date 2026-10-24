import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { HowToUse } from "@/components/calculator/HowToUse";
import BudgetPlanner from "@/components/budget/BudgetPlanner";

export const metadata: Metadata = {
  title: "Budget Planner",
  description:
    "Plan your income and expenses, track spending by category, stay on top of bills and save toward goals. Free, private, and saved only in your browser.",
};

const GUIDE = {
  steps: [
    "Set up your plan: add your take-home pay and how much you want to spend in each category. Aim for “Left to budget: $0” — every dollar gets a job.",
    "Log your spending as you go in Transactions. It takes a few seconds and keeps your totals accurate.",
    "Check the Overview each week to see what's left, which bills are coming up, and tips to stay on track.",
  ],
  needs: [
    "Your take-home pay (what lands in your bank account)",
    "Your regular bills and their due dates — rent, phone, insurance, subscriptions",
    "Your last month of bank or card statements, to see where your money usually goes",
  ],
};

export default function BudgetPlannerPage() {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="rounded hover:text-brand">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>Budget Planner</li>
          </ol>
        </nav>
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          <span aria-hidden="true">🗂️</span>
          Budget Planner
        </h1>
        <p className="max-w-3xl text-xl font-semibold text-brand-strong dark:text-brand">
          Where is my money going each month?
        </p>
        <p className="max-w-3xl text-ink-muted">
          A budget is simply a plan for your money. Decide where your income should go, track what
          you actually spend, and adjust as you learn. Everything stays private in your browser.
        </p>
      </header>

      <HowToUse
        meta={GUIDE}
        title="How to use the Budget Planner"
        tip="Not sure what to plan? Start with the suggested amounts, then adjust after your first month of tracking."
      />

      <BudgetPlanner />

      <aside
        className="rounded-card border border-border bg-surface-2 p-4 text-sm text-ink-muted"
        aria-label="Disclaimer"
      >
        <strong className="text-ink">Disclaimer:</strong> {SITE.disclaimer}
      </aside>
    </article>
  );
}
