import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { CALCULATORS, GROUPS } from "@/lib/calculators";

describe("calculator registry", () => {
  it("every calculator appears in exactly one hub group matching its group field", () => {
    const listed = GROUPS.flatMap((g) => g.slugs.map((slug) => ({ slug, group: g.id })));
    expect(listed.map((l) => l.slug).sort()).toEqual(CALCULATORS.map((c) => c.slug).sort());
    for (const l of listed) expect(CALCULATORS.find((c) => c.slug === l.slug)?.group).toBe(l.group);
  });

  it("every calculator has an explainer and a component", () => {
    const registry = fs.readFileSync(
      path.join(__dirname, "../../components/calculators/registry.ts"),
      "utf8",
    );
    for (const c of CALCULATORS) {
      expect(
        fs.existsSync(path.join(__dirname, "../../content/explainers", `${c.slug}.md`)),
        `${c.slug}.md`,
      ).toBe(true);
      expect(registry, c.slug).toMatch(new RegExp(`["']?${c.slug}["']?:\\s*dynamic`));
    }
  });
});
