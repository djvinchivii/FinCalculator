import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

/** Reads /content/explainers/<slug>.md at build time and returns HTML (or null if missing). */
export async function loadExplainer(slug: string): Promise<string | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    const md = await fs.readFile(
      path.join(process.cwd(), "content", "explainers", `${slug}.md`),
      "utf8",
    );
    return await marked.parse(md, { gfm: true });
  } catch {
    return null;
  }
}
