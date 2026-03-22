import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolMetadata } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import ImageConverter from "@/components/tools/ImageConverter";

const SLUG = "image-converter";

export function generateMetadata(): Metadata {
  const tool = getToolBySlug(SLUG);
  if (!tool) return {};
  return generateToolMetadata(tool);
}

export default function ImageConverterPage() {
  const tool = getToolBySlug(SLUG);
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <ImageConverter />
    </ToolLayout>
  );
}
