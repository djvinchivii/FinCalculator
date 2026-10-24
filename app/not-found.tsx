import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-ink-muted">That calculator doesn’t exist (yet).</p>
      <Link
        href="/"
        className="inline-block rounded-lg bg-brand px-4 py-2 font-semibold text-brand-ink"
      >
        Browse all calculators
      </Link>
    </div>
  );
}
