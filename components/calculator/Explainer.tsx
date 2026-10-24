/** Renders the build-time HTML of /content/explainers/<slug>.md (trusted, first-party content). */
export function Explainer({ html }: { html: string }) {
  return (
    <section aria-labelledby="explainer-heading" className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-8">
      <h2 id="explainer-heading" className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand">
        What this means
      </h2>
      <div className="prose-explainer max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
