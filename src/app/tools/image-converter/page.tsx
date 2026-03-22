import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolMetadata } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import ImageConverter from "@/components/tools/ImageConverter";

const tool = getToolBySlug("image-converter")!;

export function generateMetadata(): Metadata {
  return generateToolMetadata(tool);
}

export default function ImageConverterPage() {
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <ImageConverter />
    </ToolLayout>
  );
}
