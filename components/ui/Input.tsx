"use client";

import { forwardRef, useLayoutEffect, useRef } from "react";
import { groupDigits } from "@/lib/format";
import { controlClass } from "./Field";

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "prefix"> {
  value: string;
  onValueChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  /** Group thousands with commas as the user types. */
  grouping?: boolean;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  invalid?: boolean;
}

const SIGNIFICANT = /[0-9.\-]/;

function sanitize(raw: string, allowDecimal: boolean, allowNegative: boolean): string {
  let out = "";
  let seenDot = false;
  for (const [i, ch] of [...raw].entries()) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if (ch === "." && allowDecimal && !seenDot) {
      out += ch;
      seenDot = true;
    } else if (ch === "-" && allowNegative && i === 0) out += ch;
  }
  return out.slice(0, 18);
}

/** Text input for numbers: formats with commas while typing and keeps the caret in place. */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { value, onValueChange, prefix, suffix, grouping = true, allowDecimal = true, allowNegative = false, invalid, className = "", ...rest },
  forwardedRef,
) {
  const innerRef = useRef<HTMLInputElement | null>(null);
  const pendingCaret = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (el && pendingCaret.current !== null && document.activeElement === el) {
      // Place the caret after the same number of significant characters as before formatting.
      let count = 0;
      let pos = 0;
      while (pos < el.value.length && count < pendingCaret.current) {
        if (SIGNIFICANT.test(el.value[pos] ?? "")) count++;
        pos++;
      }
      el.setSelectionRange(pos, pos);
    }
    pendingCaret.current = null;
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const caret = e.target.selectionStart ?? raw.length;
    pendingCaret.current = [...raw.slice(0, caret)].filter((c) => SIGNIFICANT.test(c)).length;
    const clean = sanitize(raw, allowDecimal, allowNegative);
    onValueChange(grouping ? groupDigits(clean) : clean);
  };

  return (
    <div className="relative">
      {prefix && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
          {prefix}
        </span>
      )}
      <input
        ref={(node) => {
          innerRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        autoComplete="off"
        spellCheck={false}
        value={grouping ? groupDigits(sanitize(value, allowDecimal, allowNegative)) : value}
        onChange={handleChange}
        aria-invalid={invalid || undefined}
        className={`${controlClass} ${invalid ? "border-danger" : "border-border"} ${prefix ? "pl-7" : ""} ${suffix ? "pr-14" : ""} tabular-nums ${className}`}
        {...rest}
      />
      {suffix && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-muted">
          {suffix}
        </span>
      )}
    </div>
  );
});
