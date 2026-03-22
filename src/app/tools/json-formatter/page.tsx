import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolMetadata } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import JsonFormatter from "@/components/tools/JsonFormatter";

const tool = getToolBySlug("json-formatter")!;

export function generateMetadata(): Metadata {
  return generateToolMetadata(tool);
}

export default function JsonFormatterPage() {
  return (
    <ToolLayout tool={tool}>
      <JsonFormatter />
    </ToolLayout>
  );
}
