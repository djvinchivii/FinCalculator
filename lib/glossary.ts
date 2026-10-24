/**
 * Plain-language definitions shared by input tooltips (ⓘ) and the Beginner's Guide glossary.
 * Keep each `short` to one sentence a newcomer can understand without other jargon.
 */

export interface GlossaryEntry {
  term: string;
  short: string;
  /** Optional extra sentence or example for the guide page. */
  more?: string;
}

export const GLOSSARY = {
  principal: {
    term: "Principal",
    short: "The original amount of money you borrow, save or invest — not counting any interest.",
  },
  interest: {
    term: "Interest",
    short:
      "The extra money paid for using someone else's money: you earn it when you save, and you pay it when you borrow.",
  },
  interestRate: {
    term: "Interest rate",
    short: "How much interest you pay or earn each year, as a percentage of the amount.",
    more: "A 5% yearly rate means $5 of interest for every $100, every year.",
  },
  apr: {
    term: "APR (annual percentage rate)",
    short:
      "The yearly interest rate on a loan or credit card, before interest-on-interest is counted.",
    more: "Loans and credit cards advertise APR. Because interest is usually added monthly, you really pay a bit more than the APR — that true yearly cost is the APY.",
  },
  apy: {
    term: "APY (annual percentage yield)",
    short: "What you actually earn (or pay) in a year once interest-on-interest is included.",
    more: "Savings accounts advertise APY. For the same rate, APY is always a little higher than APR.",
  },
  compounding: {
    term: "Compound interest",
    short: "Earning interest on your interest — your balance grows faster and faster over time.",
    more: "Save $100 at 10%: after year one you have $110, and next year you earn 10% on $110, not $100.",
  },
  compoundingFrequency: {
    term: "Compounding frequency",
    short:
      "How often earned interest is added to your balance (for example, monthly). More often means slightly faster growth.",
  },
  contribution: {
    term: "Contribution",
    short:
      "Money you add to your savings or investments on a regular schedule, like $200 every month.",
  },
  contributionTiming: {
    term: "Contribution timing",
    short:
      "Whether you add money at the start or end of each period. Adding it at the start gives it a little extra time to grow.",
  },
  term: {
    term: "Loan term",
    short:
      "How long you have to pay back a loan, such as 5 years for a car or 30 years for a home.",
  },
  amortization: {
    term: "Amortization schedule",
    short:
      "A payment-by-payment table showing how much of each payment goes to interest and how much pays down the loan.",
    more: "Early on, most of your payment is interest. Later, most of it pays down what you owe.",
  },
  balance: {
    term: "Balance",
    short: "How much you still owe on a debt (or how much is in an account) right now.",
  },
  minimumPayment: {
    term: "Minimum payment",
    short: "The smallest amount a lender requires you to pay each month to stay in good standing.",
    more: "Paying only the minimum on a credit card can take many years and cost a lot in interest.",
  },
  extraPayment: {
    term: "Extra payment",
    short:
      "Any amount you pay above your required payment. It goes straight to the amount you owe, so you pay less interest overall.",
  },
  downPayment: {
    term: "Down payment",
    short: "The cash you pay upfront when buying a home; the rest is borrowed with a mortgage.",
  },
  pmi: {
    term: "PMI (private mortgage insurance)",
    short:
      "An extra monthly fee most lenders charge if your down payment is under 20%. It goes away once you've paid down enough of the loan.",
  },
  propertyTax: {
    term: "Property tax",
    short:
      "A yearly tax your local government charges homeowners, usually based on the home's value.",
  },
  homeInsurance: {
    term: "Homeowners insurance",
    short:
      "Insurance that pays to repair or rebuild your home after damage like fire or storms. Lenders require it.",
  },
  hoa: {
    term: "HOA dues",
    short: "Monthly fees some neighborhoods, condos and townhomes charge to maintain shared areas.",
  },
  inflation: {
    term: "Inflation",
    short:
      "The general rise in prices over time, which means each dollar buys a little less every year.",
    more: "Over the long run, U.S. prices have risen about 3% a year on average.",
  },
  purchasingPower: {
    term: "Purchasing power",
    short: "How much stuff your money can actually buy. Inflation slowly shrinks it.",
  },
  todaysDollars: {
    term: "Today's dollars",
    short: "A future amount adjusted for inflation, so you can see what it would buy today.",
    more: "$1 million in 30 years might only buy what about $400,000 buys today.",
  },
  realReturn: {
    term: "Real return",
    short:
      "Your investment growth after subtracting the effect of inflation — how much richer you actually got.",
  },
  returnRate: {
    term: "Rate of return",
    short:
      "How much an investment grows in a year, as a percentage. It's an average — real investments go up and down.",
  },
  cagr: {
    term: "CAGR (compound annual growth rate)",
    short:
      "The steady yearly growth rate that would turn your starting value into your ending value.",
  },
  volatility: {
    term: "Volatility",
    short:
      "How much an investment's value jumps up and down from year to year. Higher volatility means a bumpier ride.",
  },
  avalanche: {
    term: "Avalanche method",
    short: "Paying off the debt with the highest interest rate first. It saves the most money.",
  },
  snowball: {
    term: "Snowball method",
    short:
      "Paying off the smallest debt first. You see progress sooner, which keeps many people motivated.",
  },
  emergencyFund: {
    term: "Emergency fund",
    short:
      "Savings set aside only for surprises, like losing your job or a big car repair — usually 3 to 6 months of essential costs.",
  },
  takeHomePay: {
    term: "Take-home pay",
    short:
      "Your pay after taxes and deductions — the amount that actually lands in your bank account.",
  },
  needsWants: {
    term: "Needs vs. wants",
    short:
      "Needs are bills you must pay (rent, groceries, utilities). Wants are nice-to-haves (eating out, streaming, travel).",
  },
  fireNumber: {
    term: "FIRE number",
    short:
      "How much you'd need invested to live off it — roughly 25 times what you spend in a year.",
    more: "FIRE stands for “Financial Independence, Retire Early.”",
  },
  withdrawalRate: {
    term: "Withdrawal rate",
    short:
      "The share of your savings you take out each year in retirement. 4% is a common rule of thumb.",
  },
  ruleOf72: {
    term: "Rule of 72",
    short:
      "A quick trick: divide 72 by your yearly rate to estimate how many years it takes money to double.",
    more: "At 8% a year, 72 ÷ 8 = about 9 years.",
  },
  simpleInterest: {
    term: "Simple interest",
    short: "Interest charged only on the original amount, never on past interest.",
  },
  dayCount: {
    term: "Day-count basis",
    short:
      "Whether a lender treats a year as 365 days or 360 days. Using 360 makes the interest slightly higher.",
  },
} satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof GLOSSARY;

/** One-sentence definition for a tooltip. */
export function define(key: GlossaryKey): string {
  return GLOSSARY[key].short;
}
