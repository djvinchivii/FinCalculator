/** All Budget Planner state changes, as a pure reducer (easy to test, no React). */
import { D, num } from "@/lib/finance/decimal";
import {
  newId,
  type BudgetCategory,
  type BudgetData,
  type BudgetGroup,
  type IncomeSource,
  type SavingsGoal,
  type Transaction,
} from "./model";

export type BudgetAction =
  | { type: "replace"; data: BudgetData }
  | { type: "addIncome" }
  | { type: "updateIncome"; id: string; patch: Partial<Omit<IncomeSource, "id">> }
  | { type: "removeIncome"; id: string }
  | { type: "addCategory"; group: BudgetGroup }
  | { type: "updateCategory"; id: string; patch: Partial<Omit<BudgetCategory, "id">> }
  | { type: "removeCategory"; id: string }
  | { type: "saveTransaction"; tx: Transaction }
  | { type: "removeTransaction"; id: string }
  | { type: "toggleBillPaid"; monthKey: string; categoryId: string }
  | { type: "addGoal"; goal?: Partial<Omit<SavingsGoal, "id">> }
  | { type: "updateGoal"; id: string; patch: Partial<Omit<SavingsGoal, "id">> }
  | { type: "contributeGoal"; id: string; amount: number }
  | { type: "removeGoal"; id: string }
  | { type: "keepSampleAsMine" };

export function budgetReducer(state: BudgetData, action: BudgetAction): BudgetData {
  switch (action.type) {
    case "replace":
      return action.data;
    case "addIncome":
      return {
        ...state,
        incomes: [
          ...state.incomes,
          { id: newId("inc"), name: "", amount: 0, frequency: "monthly" },
        ],
      };
    case "updateIncome":
      return {
        ...state,
        incomes: state.incomes.map((i) => (i.id === action.id ? { ...i, ...action.patch } : i)),
      };
    case "removeIncome":
      return { ...state, incomes: state.incomes.filter((i) => i.id !== action.id) };
    case "addCategory":
      return {
        ...state,
        categories: [
          ...state.categories,
          { id: newId("cat"), name: "", group: action.group, planned: 0, dueDay: null },
        ],
      };
    case "updateCategory":
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c,
        ),
      };
    case "removeCategory": {
      // Keep the spending history, but mark it uncategorized.
      const paidBills: BudgetData["paidBills"] = {};
      for (const [k, ids] of Object.entries(state.paidBills))
        paidBills[k] = ids.filter((i) => i !== action.id);
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.id),
        transactions: state.transactions.map((t) =>
          t.categoryId === action.id ? { ...t, categoryId: null } : t,
        ),
        paidBills,
      };
    }
    case "saveTransaction": {
      const exists = state.transactions.some((t) => t.id === action.tx.id);
      const tx = action.tx.type === "income" ? { ...action.tx, categoryId: null } : action.tx;
      return {
        ...state,
        transactions: exists
          ? state.transactions.map((t) => (t.id === tx.id ? tx : t))
          : [...state.transactions, tx],
      };
    }
    case "removeTransaction":
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };
    case "toggleBillPaid": {
      const current = state.paidBills[action.monthKey] ?? [];
      const next = current.includes(action.categoryId)
        ? current.filter((i) => i !== action.categoryId)
        : [...current, action.categoryId];
      return { ...state, paidBills: { ...state.paidBills, [action.monthKey]: next } };
    }
    case "addGoal":
      return {
        ...state,
        goals: [
          ...state.goals,
          { id: newId("goal"), name: "", target: 0, saved: 0, monthly: 0, ...action.goal },
        ],
      };
    case "updateGoal":
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.id ? { ...g, ...action.patch } : g)),
      };
    case "contributeGoal":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.id
            ? { ...g, saved: Math.max(0, num(new D(g.saved).plus(action.amount))) }
            : g,
        ),
      };
    case "removeGoal":
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };
    case "keepSampleAsMine":
      return { ...state, isSample: false };
  }
}
