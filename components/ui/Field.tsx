import type { ReactNode } from "react";
import { Tooltip } from "./Tooltip";

export interface FieldChromeProps {
  id: string;
  label: string;
  tooltip?: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}

/** Label + ⓘ tooltip + control + hint/error text, wired together for screen readers. */
export function FieldChrome({ id, label, tooltip, hint, error, children, className = "" }: FieldChromeProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-1">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {tooltip && <Tooltip term={label}>{tooltip}</Tooltip>}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, error?: string, hint?: ReactNode): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export const controlClass =
  "w-full min-h-[44px] rounded-lg border bg-surface px-3 py-2 text-base text-ink placeholder:text-ink-muted/70 focus:border-brand disabled:opacity-60";
