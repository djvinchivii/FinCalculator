import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-sm text-ink-muted sm:px-6">
        <p>
          <strong className="text-ink">Disclaimer:</strong> {SITE.disclaimer}
        </p>
        <p>
          © {new Date().getFullYear()} {SITE.name}. No accounts, no tracking — your inputs never
          leave your browser.
        </p>
      </div>
    </footer>
  );
}
