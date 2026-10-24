"use client";

import { useId, useState, type ReactNode } from "react";

export interface Column<Row> {
  header: string;
  cell: (row: Row) => ReactNode;
  align?: "left" | "right";
}

const PAGE_SIZE = 60;
const PAGINATE_AFTER = 120;

/** Collapsible schedule table; paginates when there are more than 120 rows. */
export function ScheduleTable<Row>({
  title,
  rows,
  columns,
  rowKey,
  defaultOpen = false,
  actions,
}: {
  title: string;
  rows: Row[];
  columns: Column<Row>[];
  rowKey: (row: Row, index: number) => string | number;
  defaultOpen?: boolean;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [page, setPage] = useState(0);
  const id = useId();
  const paginate = rows.length > PAGINATE_AFTER;
  const pages = paginate ? Math.ceil(rows.length / PAGE_SIZE) : 1;
  const current = Math.min(page, pages - 1);
  const visible = paginate ? rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE) : rows;

  return (
    <section className="rounded-card border border-border bg-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
        <h3 className="text-lg font-semibold">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-md text-left"
          >
            <span aria-hidden="true" className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}>
              ▸
            </span>
            {title}
            <span className="text-sm font-normal text-ink-muted">({rows.length} rows)</span>
          </button>
        </h3>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {open && (
        <div id={id} className="border-t border-border">
          <div className="max-h-[32rem] overflow-auto">
            <table className="w-full min-w-[36rem] border-collapse text-sm tabular-nums">
              <caption className="sr-only">{title}</caption>
              <thead className="sticky top-0 bg-surface-2 text-ink-muted">
                <tr>
                  {columns.map((c, ci) => (
                    <th key={ci} scope="col" className={`whitespace-nowrap px-3 py-2 font-semibold ${c.align === "left" ? "text-left" : "text-right"}`}>
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((row, i) => (
                  <tr key={rowKey(row, i)} className="border-t border-border/60 odd:bg-surface even:bg-surface-2/40">
                    {columns.map((c, ci) => (
                      <td key={ci} className={`whitespace-nowrap px-3 py-1.5 ${c.align === "left" ? "text-left" : "text-right"}`}>
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginate && (
            <nav aria-label={`${title} pages`} className="flex items-center justify-between gap-2 border-t border-border p-3 text-sm">
              <button
                type="button"
                disabled={current === 0}
                onClick={() => setPage(current - 1)}
                className="min-h-[40px] rounded-lg border border-border px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-ink-muted" aria-live="polite">
                Rows {current * PAGE_SIZE + 1}–{Math.min(rows.length, (current + 1) * PAGE_SIZE)} of {rows.length}
              </span>
              <button
                type="button"
                disabled={current >= pages - 1}
                onClick={() => setPage(current + 1)}
                className="min-h-[40px] rounded-lg border border-border px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                Next →
              </button>
            </nav>
          )}
        </div>
      )}
    </section>
  );
}
