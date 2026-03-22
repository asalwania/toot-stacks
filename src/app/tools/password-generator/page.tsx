import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolMetadata } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import PasswordGenerator from "@/components/tools/PasswordGenerator";

const tool = getToolBySlug("password-generator")!;

export function generateMetadata(): Metadata {
  return generateToolMetadata(tool);
}

export default function PasswordGeneratorPage() {
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <PasswordGenerator />
    </ToolLayout>
  );
}
