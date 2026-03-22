import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolMetadata } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import RegexTester from "@/components/tools/RegexTester";

const tool = getToolBySlug("regex-tester")!;

export function generateMetadata(): Metadata {
  return generateToolMetadata(tool);
}

export default function RegexTesterPage() {
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <RegexTester />
    </ToolLayout>
  );
}
