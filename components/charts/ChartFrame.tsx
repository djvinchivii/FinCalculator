import type { ReactNode } from "react";

export interface DataTableColumn {
  key: string;
  label: string;
  format: (value: number) => string;
}

/**
 * Wraps a chart with a title and an accessible data-table fallback. The SVG itself is hidden from
 * assistive tech; the table carries the same numbers.
 */
export function ChartFrame({
  title,
  children,
  data,
  xKey,
  xLabel,
  columns,
  height = 300,
}: {
  title: string;
  children: ReactNode;
  data: Record<string, number | string | null>[];
  xKey: string;
  xLabel: string;
  columns: DataTableColumn[];
  height?: number;
}) {
  return (
    <figure className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-6">
      <figcaption className="mb-3 text-lg font-semibold">{title}</figcaption>
      <div aria-hidden="true" inert style={{ height }} className="w-full min-w-0">
        {children}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer rounded font-medium text-ink-muted hover:text-ink">
          View chart data as a table
        </summary>
        <div
          className="mt-2 max-h-72 overflow-auto"
          tabIndex={0}
          role="region"
          aria-label={`${title} data`}
        >
          <table className="w-full border-collapse tabular-nums">
            <caption className="sr-only">{title}</caption>
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                <th scope="col" className="px-2 py-1 text-left">
                  {xLabel}
                </th>
                {columns.map((c) => (
                  <th key={c.key} scope="col" className="px-2 py-1 text-right">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-t border-border/60">
                  <th scope="row" className="px-2 py-1 text-left font-normal">
                    {String(row[xKey] ?? "")}
                  </th>
                  {columns.map((c) => {
                    const v = row[c.key];
                    return (
                      <td key={c.key} className="px-2 py-1 text-right">
                        {typeof v === "number" ? c.format(v) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
