import { forwardRef } from "react";
import { controlClass } from "./Field";

export interface SelectOption {
  value: string;
  label: string;
}

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[]; invalid?: boolean }
>(function Select({ options, invalid, className = "", ...rest }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={`${controlClass} appearance-none pr-9 ${invalid ? "border-danger" : "border-border"} ${className}`}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-muted">
        ▾
      </span>
    </div>
  );
});
