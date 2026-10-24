"use client";

import { useId } from "react";

export interface ToggleOption {
  value: string;
  label: string;
}

/** Segmented control backed by native radio buttons (arrow keys work out of the box). */
export function Toggle({
  label,
  value,
  onChange,
  options,
  name,
  hideLabel = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ToggleOption[];
  name?: string;
  hideLabel?: boolean;
}) {
  const autoName = useId();
  const groupName = name ?? autoName;
  return (
    <fieldset className="space-y-1.5">
      <legend className={hideLabel ? "sr-only" : "mb-1.5 text-sm font-medium text-ink"}>{label}</legend>
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1">
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label
              key={o.value}
              className={`flex min-h-[36px] flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-center text-sm font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
                checked ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                name={groupName}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
