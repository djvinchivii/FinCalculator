"use client";

import { useState } from "react";
import { downloadCsv, toCsv, type CsvColumn } from "@/lib/csv";

const btn =
  "inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-brand hover:text-brand";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers without async clipboard permission.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

function useFlash(): [string | null, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  return [
    msg,
    (m: string) => {
      setMsg(m);
      setTimeout(() => setMsg(null), 2000);
    },
  ];
}

export function ShareButton({ getUrl }: { getUrl: () => string }) {
  const [flash, setFlash] = useFlash();
  return (
    <button
      type="button"
      className={btn}
      onClick={async () => setFlash((await copyText(getUrl())) ? "Link copied!" : "Copy failed")}
    >
      <span aria-hidden="true">🔗</span>
      <span aria-live="polite">{flash ?? "Share link"}</span>
    </button>
  );
}

export function CopyResultsButton({ getText }: { getText: () => string }) {
  const [flash, setFlash] = useFlash();
  return (
    <button
      type="button"
      className={btn}
      onClick={async () => setFlash((await copyText(getText())) ? "Copied!" : "Copy failed")}
    >
      <span aria-hidden="true">📋</span>
      <span aria-live="polite">{flash ?? "Copy results"}</span>
    </button>
  );
}

export function ExportButton<Row>({
  filename,
  rows,
  columns,
  label = "Export CSV",
}: {
  filename: string;
  rows: Row[];
  columns: CsvColumn<Row>[];
  label?: string;
}) {
  return (
    <button
      type="button"
      className={btn}
      disabled={rows.length === 0}
      onClick={() => downloadCsv(filename, toCsv(rows, columns))}
    >
      <span aria-hidden="true">⬇️</span>
      {label}
    </button>
  );
}
