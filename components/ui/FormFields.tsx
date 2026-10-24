"use client";

import type { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { parseNumber } from "@/lib/format";
import { FieldChrome, controlClass, describedBy } from "./Field";
import { NumberInput } from "./Input";
import { Select, type SelectOption } from "./Select";
import { Slider } from "./Slider";
import { Toggle, type ToggleOption } from "./Toggle";
import { Tooltip } from "./Tooltip";

interface BaseProps {
  name: string;
  label: string;
  tooltip?: ReactNode;
  hint?: ReactNode;
  className?: string;
}

function fieldId(name: string) {
  return `f-${name.replace(/[^a-zA-Z0-9]/g, "-")}`;
}

interface NumberFieldProps extends BaseProps {
  prefix?: string;
  suffix?: string;
  grouping?: boolean;
  allowDecimal?: boolean;
  placeholder?: string;
  /** Pair the field with a range slider. */
  slider?: { min: number; max: number; step?: number };
}

/** Form-bound numeric field (value stored as the raw text the user typed). */
export function NumberField({
  name,
  label,
  tooltip,
  hint,
  className,
  slider,
  ...input
}: NumberFieldProps) {
  const { control } = useFormContext();
  const id = fieldId(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const error = fieldState.error?.message;
        const value = typeof field.value === "string" ? field.value : String(field.value ?? "");
        return (
          <FieldChrome
            id={id}
            label={label}
            tooltip={tooltip}
            hint={hint}
            error={error}
            className={className}
          >
            <NumberInput
              id={id}
              ref={field.ref}
              name={field.name}
              value={value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              invalid={Boolean(error)}
              aria-describedby={describedBy(id, error, hint)}
              {...input}
            />
            {slider && (
              <Slider
                label={label}
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={parseNumber(value) ?? slider.min}
                onChange={(v) => field.onChange(String(v))}
              />
            )}
          </FieldChrome>
        );
      }}
    />
  );
}

export function MoneyField(props: Omit<NumberFieldProps, "prefix">) {
  return <NumberField prefix="$" placeholder="0" {...props} />;
}

export function PercentField(props: Omit<NumberFieldProps, "suffix" | "grouping">) {
  return <NumberField suffix="%" grouping={false} placeholder="0" {...props} />;
}

interface SelectFieldProps extends BaseProps {
  options: SelectOption[];
}

export function SelectField({ name, label, tooltip, hint, className, options }: SelectFieldProps) {
  const { register, getFieldState, formState } = useFormContext();
  const id = fieldId(name);
  const error = getFieldState(name, formState).error?.message;
  return (
    <FieldChrome
      id={id}
      label={label}
      tooltip={tooltip}
      hint={hint}
      error={error}
      className={className}
    >
      <Select
        id={id}
        options={options}
        invalid={Boolean(error)}
        aria-describedby={describedBy(id, error, hint)}
        {...register(name)}
      />
    </FieldChrome>
  );
}

interface ToggleFieldProps extends BaseProps {
  options: ToggleOption[];
}

export function ToggleField({ name, label, tooltip, className, options }: ToggleFieldProps) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className={`flex items-start gap-1 ${className ?? ""}`}>
          <div className="flex-1">
            <Toggle
              label={label}
              name={field.name}
              value={String(field.value)}
              onChange={field.onChange}
              options={options}
            />
          </div>
          {tooltip && (
            <div className="pt-0.5">
              <Tooltip term={label}>{tooltip}</Tooltip>
            </div>
          )}
        </div>
      )}
    />
  );
}

export function DateField({ name, label, tooltip, hint, className }: BaseProps) {
  const { register, getFieldState, formState } = useFormContext();
  const id = fieldId(name);
  const error = getFieldState(name, formState).error?.message;
  return (
    <FieldChrome
      id={id}
      label={label}
      tooltip={tooltip}
      hint={hint}
      error={error}
      className={className}
    >
      <input
        id={id}
        type="date"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${controlClass} ${error ? "border-danger" : "border-border"}`}
        {...register(name)}
      />
    </FieldChrome>
  );
}

export function TextField({
  name,
  label,
  tooltip,
  hint,
  className,
  placeholder,
}: BaseProps & { placeholder?: string }) {
  const { register, getFieldState, formState } = useFormContext();
  const id = fieldId(name);
  const error = getFieldState(name, formState).error?.message;
  return (
    <FieldChrome
      id={id}
      label={label}
      tooltip={tooltip}
      hint={hint}
      error={error}
      className={className}
    >
      <input
        id={id}
        type="text"
        maxLength={40}
        placeholder={placeholder}
        aria-invalid={Boolean(error) || undefined}
        className={`${controlClass} ${error ? "border-danger" : "border-border"}`}
        {...register(name)}
      />
    </FieldChrome>
  );
}
