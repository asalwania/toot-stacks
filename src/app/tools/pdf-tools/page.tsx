import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolMetadata } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import PdfTools from "@/components/tools/PdfTools";

const tool = getToolBySlug("pdf-tools")!;

export function generateMetadata(): Metadata {
  return generateToolMetadata(tool);
}

export default function PdfToolsPage() {
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <PdfTools />
    </ToolLayout>
  );
}
