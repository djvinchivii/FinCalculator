import Link from "next/link";
import { SITE } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md font-display text-lg font-bold tracking-tight"
        >
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-brand-ink"
          >
            F
          </span>
          <span>{SITE.name}</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/#calculators"
            className="rounded-md px-2 py-1 text-sm font-medium text-ink-muted hover:text-ink"
          >
            Calculators
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
