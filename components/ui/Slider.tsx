"use client";

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
}) {
  const clamped = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={clamped}
      aria-label={`${label} slider`}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-6 w-full cursor-pointer"
    />
  );
}
