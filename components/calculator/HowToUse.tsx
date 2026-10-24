import Link from "next/link";
import type { CalculatorMeta } from "@/lib/calculators";

/** Beginner-friendly quick start: three steps, what to have handy, and a link to the guide. */
export function HowToUse({
  meta,
  title = "How to use this calculator",
}: {
  meta: Pick<CalculatorMeta, "steps" | "needs">;
  title?: string;
}) {
  return (
    <details open className="group rounded-card border border-brand/30 bg-brand-soft/40 p-4 sm:p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md font-semibold text-ink [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span aria-hidden="true">💡</span> {title}
        </span>
        <span className="text-sm font-medium text-ink-muted">
          <span className="group-open:hidden">Show</span>
          <span className="hidden group-open:inline">Hide</span>
        </span>
      </summary>
      <div className="mt-4 grid gap-6 md:grid-cols-[3fr_2fr]">
        <ol className="space-y-3">
          {meta.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span
                aria-hidden="true"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-brand-ink"
              >
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-ink">
                <span className="sr-only">Step {i + 1}: </span>
                {step}
              </span>
            </li>
          ))}
        </ol>
        <div className="space-y-3 text-sm">
          <h2 className="font-semibold text-ink">What you&apos;ll need</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-ink-muted">
            {meta.needs.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="text-ink-muted">
            Don&apos;t know a number? Leave the example value in, or tap the{" "}
            <span aria-label="info">ⓘ</span> next to it.{" "}
            <Link
              href="/guide/"
              className="font-semibold text-brand underline-offset-2 hover:underline"
            >
              New to this? Read the Beginner&apos;s Guide →
            </Link>
          </p>
        </div>
      </div>
    </details>
  );
}
