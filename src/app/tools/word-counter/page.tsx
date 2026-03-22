import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools-registry";
import { generateToolMetadata } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import WordCounter from "@/components/tools/WordCounter";

const tool = getToolBySlug("word-counter")!;

export function generateMetadata(): Metadata {
  return generateToolMetadata(tool);
}

export default function WordCounterPage() {
  return (
    <ToolLayout tool={tool}>
      <WordCounter />
    </ToolLayout>
  );
}
