/** Schedule → CSV. Uses CRLF and a UTF-8 BOM so Excel and Google Sheets open it cleanly. */

export type CsvCell = string | number | null | undefined;

export interface CsvColumn<Row> {
  header: string;
  value: (row: Row) => CsvCell;
}

function escapeCell(cell: CsvCell): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "number") {
    if (!Number.isFinite(cell)) return "";
    const rounded = Math.round(cell * 100) / 100;
    return String(rounded === 0 ? 0 : rounded);
  }
  // Neutralize spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv<Row>(rows: Row[], columns: CsvColumn<Row>[]): string {
  const lines = [columns.map((c) => escapeCell(c.header)).join(",")];
  for (const row of rows) lines.push(columns.map((c) => escapeCell(c.value(row))).join(","));
  return lines.join("\r\n") + "\r\n";
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
