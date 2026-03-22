import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolMetadata } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import CssGradient from "@/components/tools/CssGradient";

const SLUG = "css-gradient";

export function generateMetadata(): Metadata {
  const tool = getToolBySlug(SLUG);
  if (!tool) return {};
  return generateToolMetadata(tool);
}

export default function CssGradientPage() {
  const tool = getToolBySlug(SLUG);
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <CssGradient />
    </ToolLayout>
  );
}
