import Link from "next/link";
import type { ReactNode } from "react";
import type { CalculatorMeta } from "@/lib/calculators";
import { GROUPS } from "@/lib/calculators";
import { SITE } from "@/lib/site";
import { Explainer } from "./Explainer";

/** Page frame for every calculator: breadcrumb, title, the calculator, explainer and disclaimer. */
export function CalculatorShell({ meta, explainerHtml, children }: { meta: CalculatorMeta; explainerHtml: string | null; children: ReactNode }) {
  const group = GROUPS.find((g) => g.id === meta.group);
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="rounded hover:text-brand">
                Calculators
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>{group?.title}</li>
          </ol>
        </nav>
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          <span aria-hidden="true">{meta.icon}</span>
          {meta.title}
        </h1>
        <p className="max-w-3xl text-ink-muted">{meta.description}</p>
      </header>

      {children}

      {explainerHtml && <Explainer html={explainerHtml} />}

      <aside className="rounded-card border border-border bg-surface-2 p-4 text-sm text-ink-muted" aria-label="Disclaimer">
        <strong className="text-ink">Disclaimer:</strong> {SITE.disclaimer}
      </aside>
    </article>
  );
}
