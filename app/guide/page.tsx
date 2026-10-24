import type { Metadata } from "next";
import Link from "next/link";
import { CALCULATORS, GROUPS, calculatorsInGroup } from "@/lib/calculators";
import { GLOSSARY } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "Beginner's Guide",
  description:
    "New to money math? Learn what interest rates mean, which calculator to use, and the key terms — in plain English.",
};

const TYPICAL_RATES: { what: string; rate: string; note: string }[] = [
  {
    what: "Regular savings or checking account",
    rate: "0% – 0.5%",
    note: "Often close to nothing.",
  },
  {
    what: "High-yield savings account or CD",
    rate: "About 0.5% – 5%",
    note: "Rises and falls with the economy.",
  },
  {
    what: "Credit card",
    rate: "About 20% – 30% APR",
    note: "One of the most expensive ways to borrow.",
  },
  { what: "Car loan", rate: "About 5% – 12% APR", note: "Depends a lot on your credit score." },
  { what: "Federal student loan", rate: "About 4% – 8%", note: "Set by the government each year." },
  {
    what: "30-year mortgage",
    rate: "About 3% – 8%",
    note: "The range seen over the last 20 years.",
  },
  {
    what: "Stock market (broad index fund)",
    rate: "About 7% – 10% a year on average",
    note: "A long-term average, not a promise. Some years are up 20%+, some down 20%+.",
  },
  {
    what: "Inflation (U.S.)",
    rate: "About 2% – 3% a year",
    note: "Long-term average; some years are much higher.",
  },
];

const SECTIONS = [
  { id: "how-it-works", title: "How the calculators work" },
  { id: "which-calculator", title: "Which calculator should I use?" },
  { id: "rates", title: "Understanding interest rates" },
  { id: "glossary", title: "Money words, explained" },
];

function SectionCard({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className="scroll-mt-20 rounded-card border border-border bg-surface p-5 shadow-card sm:p-8"
    >
      <h2 id={`${id}-h`} className="mb-4 text-2xl font-bold tracking-tight">
        {title}
      </h2>
      <div className="space-y-4 leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}

export default function GuidePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">Start here</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Beginner&apos;s Guide
        </h1>
        <p className="max-w-3xl text-lg text-ink-muted">
          You don&apos;t need to be good at math to use these calculators. This page explains how
          they work, what interest rates mean, and the money words you&apos;ll see along the way.
        </p>
        <nav aria-label="On this page" className="flex flex-wrap gap-2 pt-1">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:border-brand hover:text-brand"
            >
              {s.title}
            </a>
          ))}
        </nav>
      </header>

      <SectionCard id="how-it-works" title="How the calculators work">
        <ol className="list-decimal space-y-3 pl-6">
          <li>
            <strong className="text-ink">Fill in the boxes on the left</strong> (or at the top on a
            phone). Every calculator starts with example numbers, so you can see how it works before
            typing anything.
          </li>
          <li>
            <strong className="text-ink">Results update instantly</strong> as you type —
            there&apos;s no button to press. The big number is the main answer; the sentence under
            it explains it in words.
          </li>
          <li>
            <strong className="text-ink">Tap the ⓘ next to any word</strong> you don&apos;t know for
            a one-sentence explanation. They&apos;re also all listed at the bottom of this page.
          </li>
          <li>
            <strong className="text-ink">Play with the numbers.</strong> The best way to learn is to
            change one thing at a time — like adding $50 a month or waiting 5 more years — and watch
            what happens.
          </li>
          <li>
            <strong className="text-ink">Save or share your results</strong> with the Share link,
            Copy results and Export CSV buttons. Your numbers stay in your browser; nothing is sent
            anywhere.
          </li>
        </ol>
        <p className="rounded-lg bg-surface-2 p-4 text-sm">
          <strong className="text-ink">Remember:</strong> these are estimates to help you learn and
          plan, not financial advice. Real rates, taxes and fees vary.
        </p>
      </SectionCard>

      <SectionCard id="which-calculator" title="Which calculator should I use?">
        <p>
          Find the question that sounds like yours. If you&apos;re just starting out, work through
          them from top to bottom.
        </p>
        <div className="space-y-6">
          {GROUPS.map((g, gi) => (
            <div key={g.id}>
              <h3 className="mb-2 font-semibold text-ink">
                Level {gi + 1}: {g.title}
              </h3>
              <ul className="space-y-2">
                {calculatorsInGroup(g.id).map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/calculators/${c.slug}/`}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border border-border px-4 py-3 hover:border-brand"
                    >
                      <span className="font-medium text-ink">“{c.question}”</span>
                      <span className="text-sm font-semibold text-brand">
                        <span aria-hidden="true">{c.icon} </span>
                        {c.title} →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard id="rates" title="Understanding interest rates">
        <h3 className="font-semibold text-ink">What does a percentage rate mean?</h3>
        <p>
          A rate tells you how much money is added each year for every $100. A{" "}
          <strong className="text-ink">5% rate</strong> means about{" "}
          <strong className="text-ink">$5 a year for every $100</strong>. On $1,000 that&apos;s
          about $50 a year; on $10,000 it&apos;s about $500.
        </p>
        <p>
          When you <strong className="text-ink">save or invest</strong>, a higher rate is good —
          it&apos;s money you earn. When you <strong className="text-ink">borrow</strong>, a higher
          rate is bad — it&apos;s money you pay.
        </p>

        <h3 className="pt-2 font-semibold text-ink">How to type a rate into the calculators</h3>
        <p>
          Type the number you see, without the % sign: for 5%, type{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-ink">5</code>; for 24.99%, type{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-ink">24.99</code>. Don&apos;t
          convert it to a decimal — we do that for you.
        </p>

        <h3 className="pt-2 font-semibold text-ink">APR vs. APY: what&apos;s the difference?</h3>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong className="text-ink">APR</strong> is the basic yearly rate. Loans and credit
            cards show APR.
          </li>
          <li>
            <strong className="text-ink">APY</strong> also counts interest earned on interest during
            the year, so it&apos;s a little higher. Savings accounts show APY.
          </li>
          <li>
            Example: a 5% APR with interest added monthly works out to a 5.12% APY. To compare a
            savings account with a loan fairly, use the{" "}
            <Link
              href="/calculators/rate-tools/"
              className="font-semibold text-brand underline-offset-2 hover:underline"
            >
              Interest Rates Explained
            </Link>{" "}
            calculator.
          </li>
        </ul>

        <h3 className="pt-2 font-semibold text-ink">Where do I find my rate?</h3>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong className="text-ink">Credit cards and loans:</strong> on your monthly statement
            or in your lender&apos;s app — look for “APR” or “interest rate.”
          </li>
          <li>
            <strong className="text-ink">Savings accounts:</strong> in your bank app or on the
            bank&apos;s website — look for “APY.”
          </li>
          <li>
            <strong className="text-ink">Investments:</strong> there&apos;s no fixed rate. Use a
            long-term average from the table below, and remember real results go up and down.
          </li>
        </ul>

        <h3 className="pt-2 font-semibold text-ink">Typical rates (rough ranges)</h3>
        <p className="text-sm">
          These change with the economy and your credit, so always check your actual numbers.
          They&apos;re here to help you pick a reasonable starting point.
        </p>
        <div
          className="overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label="Typical interest rates"
        >
          <table className="w-full min-w-[32rem] text-sm">
            <caption className="sr-only">Typical rates by type of account or loan</caption>
            <thead>
              <tr className="border-b border-border text-left text-ink">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Type
                </th>
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Typical rate
                </th>
                <th scope="col" className="py-2 font-semibold">
                  Good to know
                </th>
              </tr>
            </thead>
            <tbody>
              {TYPICAL_RATES.map((r) => (
                <tr key={r.what} className="border-b border-border/60 align-top">
                  <th scope="row" className="py-2 pr-4 text-left font-medium text-ink">
                    {r.what}
                  </th>
                  <td className="whitespace-nowrap py-2 pr-4 tabular-nums">{r.rate}</td>
                  <td className="py-2">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard id="glossary" title="Money words, explained">
        <dl className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          {Object.entries(GLOSSARY).map(([key, g]) => (
            <div key={key} id={`term-${key}`} className="scroll-mt-20">
              <dt className="font-semibold text-ink">{g.term}</dt>
              <dd className="mt-1">
                {g.short}
                {"more" in g && g.more ? (
                  <span className="mt-1 block text-sm">{g.more}</span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      <p className="text-center text-ink-muted">
        Ready?{" "}
        <Link
          href="/#calculators"
          className="font-semibold text-brand underline-offset-2 hover:underline"
        >
          Browse all {CALCULATORS.length} calculators →
        </Link>
      </p>
    </div>
  );
}
