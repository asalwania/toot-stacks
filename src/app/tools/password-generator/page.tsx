import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolMetadata } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import PasswordGenerator from "@/components/tools/PasswordGenerator";

const SLUG = "password-generator";

export function generateMetadata(): Metadata {
  const tool = getToolBySlug(SLUG);
  if (!tool) return {};
  return generateToolMetadata(tool);
}

export default function PasswordGeneratorPage() {
  const tool = getToolBySlug(SLUG);
  if (!tool) notFound();

  return (
    <ToolLayout tool={tool}>
      <PasswordGenerator />
    </ToolLayout>
  );
}
