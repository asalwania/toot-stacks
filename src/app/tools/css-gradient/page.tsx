import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolMetadata } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import CssGradient from "@/components/tools/CssGradient";

const tool = getToolBySlug("css-gradient")!;

export function generateMetadata(): Metadata {
  return generateToolMetadata(tool);
}

export default function CssGradientPage() {
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <CssGradient />
    </ToolLayout>
  );
}
