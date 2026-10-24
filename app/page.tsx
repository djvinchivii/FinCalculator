import Link from "next/link";
import { GROUPS, calculatorsInGroup } from "@/lib/calculators";
import { SITE } from "@/lib/site";

export default function HubPage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4 pt-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">
          Financial & interest calculators
        </p>
        <h1 className="max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Understand your money, one calculation at a time.
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">{SITE.tagline}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/guide/"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-brand px-5 py-2.5 font-semibold text-brand-ink hover:bg-brand-strong"
          >
            New here? Start with the Beginner&apos;s Guide
          </Link>
          <a
            href="#calculators"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-border bg-surface px-5 py-2.5 font-semibold text-ink hover:border-brand"
          >
            Browse calculators
          </a>
        </div>
      </section>

      <div id="calculators" className="scroll-mt-20 space-y-10">
        {GROUPS.map((group, gi) => (
          <section key={group.id} aria-labelledby={`group-${group.id}`} className="space-y-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-strong dark:text-brand">
                Level {gi + 1}
              </span>
              <h2 id={`group-${group.id}`} className="text-2xl font-bold tracking-tight">
                {group.title}
              </h2>
              <p className="w-full text-ink-muted sm:w-auto">{group.blurb}</p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {calculatorsInGroup(group.id).map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/calculators/${c.slug}/`}
                    className="group flex h-full flex-col gap-3 rounded-card border border-border bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand"
                  >
                    <span aria-hidden="true" className="text-3xl">
                      {c.icon}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {c.title}
                    </span>
                    <span className="text-lg font-semibold leading-snug group-hover:text-brand">
                      {c.question}
                    </span>
                    <span className="text-sm text-ink-muted">{c.short}</span>
                    <span className="mt-auto text-sm font-semibold text-brand" aria-hidden="true">
                      Open calculator →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
