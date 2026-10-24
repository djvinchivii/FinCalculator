import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/** slug → calculator component. Each is code-split so a page only ships its own calculator. */
export const CALCULATOR_COMPONENTS: Record<string, ComponentType> = {
  "compound-interest": dynamic(() => import("./CompoundInterest")),
  "simple-interest": dynamic(() => import("./SimpleInterest")),
  loan: dynamic(() => import("./Loan")),
  mortgage: dynamic(() => import("./Mortgage")),
  "debt-payoff": dynamic(() => import("./DebtPayoff")),
  "savings-goal": dynamic(() => import("./SavingsGoal")),
  retirement: dynamic(() => import("./Retirement")),
  "rate-tools": dynamic(() => import("./RateTools")),
  inflation: dynamic(() => import("./Inflation")),
  cagr: dynamic(() => import("./Cagr")),
  budget: dynamic(() => import("./Budget")),
};
