import type { ReactNode } from "react";

export interface Stat {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "bad";
}

/** Headline number in large type, a plain-English summary, then 2–4 supporting numbers. */
export function ResultSummary({
  headlineLabel,
  headline,
  summary,
  stats = [],
  actions,
  testId = "headline",
}: {
  headlineLabel: string;
  headline: string;
  summary?: ReactNode;
  stats?: Stat[];
  actions?: ReactNode;
  testId?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
      <div aria-live="polite" aria-atomic="true">
        <p className="text-sm font-medium text-ink-muted">{headlineLabel}</p>
        <p
          data-testid={testId}
          className="mt-1 break-words font-display text-4xl font-bold tracking-tight text-brand tabular-nums sm:text-5xl"
        >
          {headline}
        </p>
      </div>
      {summary && <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink">{summary}</p>}
      {stats.length > 0 && (
        <dl className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-surface-2 p-3">
              <dt className="text-xs font-medium text-ink-muted">{s.label}</dt>
              <dd
                className={`mt-0.5 break-words text-lg font-semibold tabular-nums ${
                  s.tone === "good" ? "text-brand" : s.tone === "bad" ? "text-danger" : "text-ink"
                }`}
              >
                {s.value}
              </dd>
              {s.hint && <dd className="text-xs text-ink-muted">{s.hint}</dd>}
            </div>
          ))}
        </dl>
      )}
      {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Alert({
  tone = "warning",
  children,
}: {
  tone?: "warning" | "danger" | "info";
  children: ReactNode;
}) {
  const cls =
    tone === "danger"
      ? "border-danger/40 bg-danger/10 text-ink"
      : tone === "info"
        ? "border-border bg-surface-2 text-ink"
        : "border-warning/30 bg-warning-soft text-warning";
  return (
    <div role="alert" className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${cls}`}>
      {children}
    </div>
  );
}
