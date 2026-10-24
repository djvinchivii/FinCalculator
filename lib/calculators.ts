/** Calculator registry (metadata only — no React), used by the hub, routing and metadata. */

export type CalculatorGroup = "basics" | "wealth" | "debt" | "long-game";

export interface CalculatorMeta {
  slug: string;
  title: string;
  short: string;
  description: string;
  group: CalculatorGroup;
  icon: string;
}

/** Hub groups, ordered beginner → advanced; `slugs` sets the card order within each group. */
export const GROUPS: { id: CalculatorGroup; title: string; blurb: string; slugs: string[] }[] = [
  {
    id: "basics",
    title: "Basics",
    blurb: "Core ideas every money decision builds on.",
    slugs: ["simple-interest", "inflation", "budget", "rate-tools"],
  },
  {
    id: "wealth",
    title: "Building Wealth",
    blurb: "See how saving and investing compound over time.",
    slugs: ["compound-interest", "savings-goal", "cagr"],
  },
  {
    id: "debt",
    title: "Debt & Borrowing",
    blurb: "Understand what loans really cost — and how to pay them off faster.",
    slugs: ["loan", "mortgage", "debt-payoff"],
  },
  {
    id: "long-game",
    title: "Long Game",
    blurb: "Plan for financial independence and retirement.",
    slugs: ["retirement"],
  },
];

export const CALCULATORS: CalculatorMeta[] = [
  {
    slug: "compound-interest",
    title: "Compound Interest",
    short: "Watch money grow with regular contributions.",
    description:
      "Project an investment's growth with recurring contributions, any compounding frequency, contribution increases and inflation.",
    group: "wealth",
    icon: "📈",
  },
  {
    slug: "simple-interest",
    title: "Simple Interest",
    short: "Interest on the principal only: I = Prt.",
    description:
      "Calculate simple interest and the total owed or earned over days, months or years.",
    group: "basics",
    icon: "➗",
  },
  {
    slug: "loan",
    title: "Loan & Amortization",
    short: "Payments, total interest and a full schedule.",
    description:
      "Find your loan payment, total interest and payoff date — and how much extra payments save.",
    group: "debt",
    icon: "🏦",
  },
  {
    slug: "mortgage",
    title: "Mortgage",
    short: "Full monthly cost with tax, insurance, HOA and PMI.",
    description:
      "Break down your full monthly mortgage payment including taxes, insurance, HOA and PMI, plus when PMI drops off.",
    group: "debt",
    icon: "🏠",
  },
  {
    slug: "debt-payoff",
    title: "Debt Payoff",
    short: "Avalanche vs. Snowball, side by side.",
    description:
      "Build a plan to pay off credit cards and other debts and compare the Avalanche and Snowball strategies.",
    group: "debt",
    icon: "💳",
  },
  {
    slug: "savings-goal",
    title: "Savings Goal",
    short: "How much to save — or how long it takes.",
    description:
      "Work out the contribution needed to hit a savings goal by a deadline, or how long a fixed contribution takes.",
    group: "wealth",
    icon: "🎯",
  },
  {
    slug: "retirement",
    title: "Retirement & FIRE",
    short: "Your nest egg, FIRE number and how long it lasts.",
    description:
      "Project your retirement nest egg, find your FIRE number and the age you reach it, and see how long your money lasts.",
    group: "long-game",
    icon: "🌅",
  },
  {
    slug: "rate-tools",
    title: "APR ↔ APY & Rule of 72",
    short: "Convert rates and estimate doubling time.",
    description:
      "Convert between APR and APY for any compounding frequency and compare the Rule of 72 with the exact doubling time.",
    group: "basics",
    icon: "🔁",
  },
  {
    slug: "inflation",
    title: "Inflation",
    short: "Future prices, purchasing power and real returns.",
    description:
      "See what things will cost in the future, what money will be worth, and your real return after inflation.",
    group: "basics",
    icon: "🎈",
  },
  {
    slug: "cagr",
    title: "Investment Return (CAGR)",
    short: "Your smoothed annual growth rate.",
    description:
      "Calculate the compound annual growth rate of an investment and compare a bumpy path with the smooth CAGR line.",
    group: "wealth",
    icon: "📊",
  },
  {
    slug: "budget",
    title: "Budget & Emergency Fund",
    short: "50/30/20 split and your safety-net target.",
    description:
      "Split take-home pay into needs, wants and savings, then size your emergency fund and see how long it takes to build.",
    group: "basics",
    icon: "🧾",
  },
];

export function getCalculator(slug: string): CalculatorMeta | undefined {
  return CALCULATORS.find((c) => c.slug === slug);
}

export function calculatorsInGroup(group: CalculatorGroup): CalculatorMeta[] {
  const slugs = GROUPS.find((g) => g.id === group)?.slugs ?? [];
  return slugs.map(getCalculator).filter((c): c is CalculatorMeta => c !== undefined);
}
