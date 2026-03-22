import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolMetadata } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import CronBuilder from "@/components/tools/CronBuilder";

const tool = getToolBySlug("cron-builder")!;

export function generateMetadata(): Metadata {
  return generateToolMetadata(tool);
}

export default function CronBuilderPage() {
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <CronBuilder />
    </ToolLayout>
  );
}
