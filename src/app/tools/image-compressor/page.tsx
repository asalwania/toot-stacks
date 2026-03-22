import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolMetadata } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import ImageCompressor from "@/components/tools/ImageCompressor";

const tool = getToolBySlug("image-compressor")!;

export function generateMetadata(): Metadata {
  return generateToolMetadata(tool);
}

export default function ImageCompressorPage() {
  return (
    <ToolLayout tool={tool}>
      <ImageCompressor />
    </ToolLayout>
  );
}
