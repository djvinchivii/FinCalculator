"use client";

import { useEffect, useState, type ReactNode } from "react";
import { NumberInput } from "@/components/ui/Input";
import { formatCurrency, groupDigits, parseNumber } from "@/lib/format";
import { MAX_AMOUNT } from "@/lib/budget/model";

function toText(n: number): string {
  if (!n) return "";
  const rounded = Math.round(n * 100) / 100;
  return groupDigits(Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2));
}

/** Dollar input backed by a number. Blank means $0; values over the limit are ignored. */
export function MoneyInput({
  value,
  onChange,
  id,
  label,
  hideLabel = false,
  className = "",
  placeholder = "0",
}: {
  value: number;
  onChange: (value: number) => void;
  id: string;
  label: string;
  hideLabel?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState(() => toText(value));
  // Follow outside changes (e.g. a restored backup) without fighting the user's typing.
  useEffect(() => {
    setText((t) => ((parseNumber(t) ?? 0) === value ? t : toText(value)));
  }, [value]);
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={hideLabel ? "sr-only" : "mb-1 block text-sm font-medium text-ink"}
      >
        {label}
      </label>
      <NumberInput
        id={id}
        prefix="$"
        value={text}
        placeholder={placeholder}
        onValueChange={(t) => {
          setText(t);
          const n = parseNumber(t);
          if (t.trim() === "") onChange(0);
          else if (n !== null && n >= 0 && n <= MAX_AMOUNT) onChange(Math.round(n * 100) / 100);
        }}
        onBlur={() => setText(toText(value))}
      />
    </div>
  );
}

export type BarTone = "ok" | "near" | "over" | "neutral";

export function ProgressBar({
  value,
  tone = "ok",
  label,
}: {
  value: number;
  tone?: BarTone;
  label: string;
}) {
  const pct = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const color =
    tone === "over"
      ? "bg-danger"
      : tone === "near"
        ? "bg-chart-3"
        : tone === "neutral"
          ? "bg-chart-1"
          : "bg-brand";
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
      className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <div
        className={`h-full rounded-full ${color} transition-[width]`}
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  testId,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  tone?: "default" | "good" | "bad";
  testId?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p
        data-testid={testId}
        className={`mt-1 break-words text-xl font-bold tabular-nums sm:text-2xl ${
          tone === "good" ? "text-brand" : tone === "bad" ? "text-danger" : "text-ink"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  actions,
  children,
  id,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="text-lg font-semibold">
          {title}
        </h2>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export const smallBtn =
  "inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-brand hover:text-brand disabled:opacity-40";
export const primaryBtn =
  "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-strong disabled:opacity-50";
export const dangerBtn =
  "inline-flex min-h-[40px] items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-semibold text-danger hover:border-danger";
export const inputCls =
  "w-full min-h-[44px] rounded-lg border border-border bg-surface px-3 py-2 text-base text-ink focus:border-brand";

/** Signed money with an explicit sign, never "-$0.00". */
export function signedMoney(n: number): string {
  const v = Math.round(n * 100) / 100;
  if (v === 0) return formatCurrency(0);
  return `${v < 0 ? "−" : "+"}${formatCurrency(Math.abs(v))}`;
}
