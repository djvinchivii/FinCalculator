import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CALCULATORS, getCalculator } from "@/lib/calculators";
import { loadExplainer } from "@/lib/explainers";
import { CalculatorShell } from "@/components/calculator/CalculatorShell";
import { CALCULATOR_COMPONENTS } from "@/components/calculators/registry";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const meta = getCalculator(slug);
  if (!meta) return {};
  return { title: `${meta.title} Calculator`, description: meta.description };
}

export default async function CalculatorPage({ params }: Params) {
  const { slug } = await params;
  const meta = getCalculator(slug);
  const Calculator = CALCULATOR_COMPONENTS[slug];
  if (!meta || !Calculator) notFound();
  const explainerHtml = await loadExplainer(slug);
  return (
    <CalculatorShell meta={meta} explainerHtml={explainerHtml}>
      <Calculator />
    </CalculatorShell>
  );
}
