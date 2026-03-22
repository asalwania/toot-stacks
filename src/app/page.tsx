"use client";

import { useState } from "react";
import Link from "next/link";
import { tools, getAllCategories, Tool } from "@/lib/tools-registry";

const categoryLabels: Record<string, string> = {
  all: "All",
  dev: "Dev",
  media: "Media",
  text: "Text",
  design: "Design",
  security: "Security",
  utility: "Utility",
};

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link href={`/tools/${tool.slug}`} className="group block">
      <div className="relative flex h-full flex-col rounded-xl border border-border/50 bg-card p-6 transition-all duration-300 hover:scale-[1.02] hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        {tool.isNew && (
          <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            New
          </span>
        )}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
          {tool.icon}
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
          {tool.name}
        </h3>
        <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
          {tool.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize text-secondary-foreground">
            {tool.category}
          </span>
          <span className="text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Open &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}

const features = [
  {
    icon: "⚡",
    title: "Lightning Fast",
    description:
      "All tools run directly in your browser. No server uploads, no waiting.",
  },
  {
    icon: "🔒",
    title: "Privacy First",
    description:
      "Your data never leaves your device. Everything is processed locally.",
  },
  {
    icon: "🎨",
    title: "Beautiful UI",
    description:
      "Clean, modern interface designed for developers who appreciate good design.",
  },
  {
    icon: "🆓",
    title: "100% Free",
    description:
      "No sign-ups, no paywalls, no limits. All tools are completely free to use.",
  },
];

export default function HomePage() {
  const categories = getAllCategories();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredTools =
    activeCategory === "all"
      ? tools
      : tools.filter((tool) => tool.category === activeCategory);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background to-secondary/20 px-4 py-20 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Developer Tools That{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Just Work
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            A collection of free, fast, and privacy-friendly tools built for
            developers. No sign-ups, no data collection &mdash; just tools that
            get the job done.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#tools"
              className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Explore Tools
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-foreground">
              All Tools
            </h2>
            <p className="text-muted-foreground">
              Pick a category or browse everything we offer.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  activeCategory === cat.category
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          {/* Tool Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>

          {filteredTools.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">
                No tools found in this category.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border/40 bg-secondary/20 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-foreground">
              Why DevToolkit?
            </h2>
            <p className="text-muted-foreground">
              Built by developers, for developers.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
