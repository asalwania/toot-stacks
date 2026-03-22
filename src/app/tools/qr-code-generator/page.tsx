import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolMetadata } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import QrCodeGenerator from "@/components/tools/QrCodeGenerator";

const tool = getToolBySlug("qr-code-generator")!;

export function generateMetadata(): Metadata {
  return generateToolMetadata(tool);
}

export default function QrCodeGeneratorPage() {
  return (
    <ToolLayout tool={tool}>
      <QrCodeGenerator />
    </ToolLayout>
  );
}
