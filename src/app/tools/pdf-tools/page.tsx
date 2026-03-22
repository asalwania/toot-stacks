import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolMetadata } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import PdfTools from "@/components/tools/PdfTools";

const SLUG = "pdf-tools";

export function generateMetadata(): Metadata {
  const tool = getToolBySlug(SLUG);
  if (!tool) return {};
  return generateToolMetadata(tool);
}

export default function PdfToolsPage() {
  const tool = getToolBySlug(SLUG);
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <PdfTools />
    </ToolLayout>
  );
}
