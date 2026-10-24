/** Calculator registry (metadata only — no React), used by the hub, routing, metadata and guides. */

export type CalculatorGroup = "basics" | "wealth" | "debt" | "long-game";

export interface CalculatorMeta {
  slug: string;
  title: string;
  /** The everyday question this calculator answers, in plain words. */
  question: string;
  /** One short line for hub cards. */
  short: string;
  /** Two-sentence plain-language intro shown under the page title. */
  description: string;
  /** Three plain steps for using the calculator. */
  steps: string[];
  /** Information to have handy before starting, and where to find it. */
  needs: string[];
  group: CalculatorGroup;
  icon: string;
}

/** Hub groups, ordered beginner → advanced; `slugs` sets the card order within each group. */
export const GROUPS: { id: CalculatorGroup; title: string; blurb: string; slugs: string[] }[] = [
  {
    id: "basics",
    title: "Basics",
    blurb: "Start here. The core ideas behind every money decision.",
    slugs: ["budget", "simple-interest", "inflation", "rate-tools"],
  },
  {
    id: "wealth",
    title: "Building Wealth",
    blurb: "See how saving and investing grow your money over time.",
    slugs: ["compound-interest", "savings-goal", "cagr"],
  },
  {
    id: "debt",
    title: "Debt & Borrowing",
    blurb: "Find out what borrowing really costs — and how to get out of debt faster.",
    slugs: ["loan", "mortgage", "debt-payoff"],
  },
  {
    id: "long-game",
    title: "Long Game",
    blurb: "Plan for the day you can stop working.",
    slugs: ["retirement"],
  },
];

export const CALCULATORS: CalculatorMeta[] = [
  {
    slug: "compound-interest",
    title: "Compound Interest",
    question: "How much will my money grow if I keep saving?",
    short: "See how saving a little every month can grow into a lot.",
    description:
      "When you save or invest, you earn interest — and then you earn interest on that interest too. This calculator shows how much your money could grow over time, and how much of it comes from you versus from growth.",
    steps: [
      "Enter what you have now and how much you plan to add regularly (for example, $100 a month).",
      "Enter a yearly growth rate and how many years you'll keep saving. Not sure what rate to use? Check the hint under the field.",
      "Read the big number at the top — that's what you could have. The chart shows how much you put in versus how much grew on its own.",
    ],
    needs: [
      "How much you have saved or invested today (can be $0)",
      "How much you can add each month or paycheck",
      "Your account's interest rate — shown in your bank or investment app as “APY” or “rate”",
    ],
    group: "wealth",
    icon: "📈",
  },
  {
    slug: "simple-interest",
    title: "Simple Interest",
    question: "How much interest will I pay or earn on a fixed amount?",
    short: "The easiest kind of interest: a set percentage of the original amount.",
    description:
      "Simple interest is charged only on the original amount, never on past interest. It's the easiest way to see how a percentage rate turns into real dollars.",
    steps: [
      "Enter the amount being borrowed or saved.",
      "Enter the yearly interest rate and how long the money is borrowed or saved.",
      "See how much interest that adds up to, and the total paid back.",
    ],
    needs: ["The amount", "The yearly interest rate", "How long (in days, months or years)"],
    group: "basics",
    icon: "➗",
  },
  {
    slug: "loan",
    title: "Loan Payment",
    question: "What will my loan cost each month — and in total?",
    short: "Your monthly payment, total interest and payoff date for any loan.",
    description:
      "Use this for car loans, personal loans, student loans and other loans with a fixed monthly payment. It shows your payment, how much of your money goes to interest, and how much you'd save by paying a little extra.",
    steps: [
      "Enter how much you're borrowing, the interest rate and how long you have to pay it back.",
      "Optional: try adding a small extra payment (even $25 or $50) to see how much faster you'd be done.",
      "Check “Total interest” — that's the real cost of borrowing on top of the amount you borrowed.",
    ],
    needs: [
      "The loan amount",
      "The interest rate or APR — on your loan offer or monthly statement",
      "The loan length (term), such as 5 years or 60 months",
    ],
    group: "debt",
    icon: "🏦",
  },
  {
    slug: "mortgage",
    title: "Mortgage",
    question: "How much will a home really cost me each month?",
    short: "Your full monthly home payment — not just the loan.",
    description:
      "A mortgage payment is more than paying back the loan: most people also pay property taxes, home insurance and sometimes extra fees each month. This calculator adds it all up so there are no surprises.",
    steps: [
      "Enter the home price and how much you'll pay upfront (your down payment).",
      "Enter the mortgage interest rate and length — 30 years is most common.",
      "Fill in taxes, insurance and HOA fees if you know them (the defaults are typical estimates), then see your full monthly payment.",
    ],
    needs: [
      "The home price and your down payment",
      "A mortgage rate — from a lender quote or a mortgage-rate website",
      "Property tax and insurance estimates — listed on most home-sale websites",
    ],
    group: "debt",
    icon: "🏠",
  },
  {
    slug: "debt-payoff",
    title: "Debt Payoff Plan",
    question: "How long until I'm debt-free?",
    short: "A step-by-step plan to pay off credit cards and other debts.",
    description:
      "List your debts and how much you can put toward them each month. You'll get your debt-free date and see which payoff method saves you the most money.",
    steps: [
      "Add each debt with its balance, interest rate (APR) and minimum payment — all on your monthly statement.",
      "Enter the total you can afford to pay toward all your debts each month.",
      "Pick a method — Avalanche saves the most money, Snowball gives you quicker wins — and see your debt-free date.",
    ],
    needs: [
      "Your latest statements: for each debt, the balance, APR and minimum payment",
      "How much you can pay toward debt each month in total",
    ],
    group: "debt",
    icon: "💳",
  },
  {
    slug: "savings-goal",
    title: "Savings Goal",
    question: "How much do I need to save to reach my goal?",
    short: "Turn a goal into a monthly savings amount — or a finish date.",
    description:
      "Saving for a car, a trip, a home or an emergency fund? Tell us your goal and deadline and we'll work out how much to save each month — or tell us what you can save and we'll tell you how long it takes.",
    steps: [
      "Choose what you want to know: “How much to save” or “How long it takes”.",
      "Enter your goal amount, what you've already saved, and your deadline or monthly savings.",
      "Enter your savings account's interest rate (use 0 if it's in a regular checking account).",
    ],
    needs: [
      "Your goal amount and deadline",
      "What you've saved so far",
      "Your savings account's rate (APY) — shown in your bank app",
    ],
    group: "wealth",
    icon: "🎯",
  },
  {
    slug: "retirement",
    title: "Retirement",
    question: "Am I saving enough to retire?",
    short: "See what you could have at retirement and how long it would last.",
    description:
      "Estimate how much you'll have saved by the time you retire and how many years that money could support you. It also finds your “FIRE number” — the amount that would let you live off your savings.",
    steps: [
      "Enter your age, the age you'd like to retire, what you've saved so far and how much you save each month.",
      "Keep the default growth and inflation rates unless you have a reason to change them — they're common long-term assumptions.",
      "Enter how much you'd want to spend each year in retirement (in today's money), then see how long your savings last.",
    ],
    needs: [
      "Your retirement account balances (401(k), IRA and so on)",
      "How much you save for retirement each month (include any employer match)",
      "A rough yearly budget for retirement",
    ],
    group: "long-game",
    icon: "🌅",
  },
  {
    slug: "rate-tools",
    title: "Interest Rates Explained",
    question: "What does this interest rate really mean?",
    short: "APR vs. APY, plus how fast money doubles (the Rule of 72).",
    description:
      "Banks and lenders show rates in different ways, which makes them hard to compare. Convert between APR and APY to compare fairly, and see how quickly a rate doubles your money.",
    steps: [
      "Pick a direction: turn an APR into an APY, or the other way round.",
      "Enter the rate and how often interest is added (monthly is most common).",
      "Below, enter any yearly return to see how many years it takes to double your money.",
    ],
    needs: ["A rate from a bank, card or loan offer — and whether it says APR or APY"],
    group: "basics",
    icon: "🔁",
  },
  {
    slug: "inflation",
    title: "Inflation",
    question: "What will things cost in the future?",
    short: "See how rising prices shrink what your money can buy.",
    description:
      "Prices tend to go up every year, so the same dollar buys a little less over time. See what something will cost later, what your cash will really be worth, and what your investments earn after inflation.",
    steps: [
      "Enter a price or amount of money you care about today.",
      "Enter an inflation rate (about 3% a year is a common long-term average) and a number of years.",
      "See the future price — and how much buying power cash loses if it just sits there.",
    ],
    needs: ["A price or amount of money", "How many years ahead you want to look"],
    group: "basics",
    icon: "🎈",
  },
  {
    slug: "cagr",
    title: "Investment Return",
    question: "How well did my investment actually do each year?",
    short: "Turn a start and end value into a simple yearly growth rate.",
    description:
      "Investments go up and down, which makes it hard to say how well they did. This finds the steady yearly growth rate (called CAGR) that gets you from your starting value to your ending value — so you can compare investments fairly.",
    steps: [
      "Enter what the investment was worth at the start and what it's worth now.",
      "Enter how many years you held it.",
      "Read your yearly growth rate. Want more detail? Switch to “Yearly values” and enter the value for each year.",
    ],
    needs: [
      "The starting and ending value (from your brokerage or retirement account)",
      "How many years you held it",
    ],
    group: "wealth",
    icon: "📊",
  },
  {
    slug: "budget",
    title: "Budget & Emergency Fund",
    question: "Where should my paycheck go?",
    short: "Split your pay into needs, wants and savings — and plan a safety net.",
    description:
      "A simple starting budget: about half your pay for needs, 30% for wants and 20% for savings. Then work out how big your emergency fund should be and how long it'll take to build.",
    steps: [
      "Enter your monthly take-home pay — the amount that actually lands in your bank account.",
      "Keep the 50/30/20 split or adjust it to fit your life (it just has to add up to 100%).",
      "Enter your essential monthly costs to see your emergency fund target and how long it takes to save.",
    ],
    needs: [
      "Your monthly take-home pay (after taxes)",
      "Your essential monthly bills: rent, utilities, groceries, insurance, minimum debt payments",
    ],
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
