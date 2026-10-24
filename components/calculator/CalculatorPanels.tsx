"use client";

import type { ReactNode } from "react";
import { FormProvider, type FieldValues, type UseFormReturn } from "react-hook-form";

/** Inputs on the left (top on mobile), results on the right (below on mobile). */
export function CalculatorPanels<TForm extends FieldValues, TOut>({
  form,
  inputs,
  results,
  isStale,
}: {
  form: UseFormReturn<TForm, unknown, TOut>;
  inputs: ReactNode;
  results: ReactNode;
  isStale?: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={(e) => e.preventDefault()}
          aria-label="Calculator inputs"
          className="space-y-5 rounded-card border border-border bg-surface p-4 shadow-card sm:p-6 lg:sticky lg:top-20"
        >
          {inputs}
        </form>
      </FormProvider>
      <section aria-label="Results" className="min-w-0 space-y-6">
        {isStale && (
          <p role="status" className="rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning">
            Some inputs need attention — showing the last valid result.
          </p>
        )}
        {results}
      </section>
    </div>
  );
}

/** Groups related inputs under a small heading. */
export function InputGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-border pt-4 first:border-t-0 first:pt-0">
      {title && <legend className="float-left mb-3 w-full text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</legend>}
      <div className="clear-both space-y-4">{children}</div>
    </fieldset>
  );
}
