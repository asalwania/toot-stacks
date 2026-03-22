"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { tools, getAllCategories, type Tool } from "@/lib/tools-registry";

/* ------------------------------------------------------------------ */
/*  Color map: tool.color → tailwind classes                          */
/* ------------------------------------------------------------------ */
const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "hover:border-blue-500/30" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "hover:border-emerald-500/30" },
  teal:    { bg: "bg-teal-500/10",    text: "text-teal-400",    border: "hover:border-teal-500/30" },
  orange:  { bg: "bg-orange-500/10",  text: "text-orange-400",  border: "hover:border-orange-500/30" },
  red:     { bg: "bg-red-500/10",     text: "text-red-400",     border: "hover:border-red-500/30" },
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "hover:border-violet-500/30" },
  pink:    { bg: "bg-pink-500/10",    text: "text-pink-400",    border: "hover:border-pink-500/30" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "hover:border-amber-500/30" },
  cyan:    { bg: "bg-cyan-500/10",    text: "text-cyan-400",    border: "hover:border-cyan-500/30" },
  lime:    { bg: "bg-lime-500/10",    text: "text-lime-400",    border: "hover:border-lime-500/30" },
};

/* ------------------------------------------------------------------ */
/*  Tool Card                                                         */
/* ------------------------------------------------------------------ */
function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  const c = colorMap[tool.color] ?? colorMap.blue;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={`group relative flex flex-col rounded-2xl border border-(--th-border) bg-(--th-card) p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-(--th-border-hover) hover:bg-(--th-card-hover) hover:shadow-lg hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${c.border}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Category pill */}
      <span className="absolute right-4 top-4 rounded-full bg-(--th-pill-bg) px-2.5 py-1 text-[11px] font-medium capitalize text-(--th-fg-faint)">
        {tool.categoryLabel}
      </span>

      {/* "New" badge */}
      {tool.isNew && (
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          NEW
        </span>
      )}

      {/* Icon */}
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${c.bg} ${tool.isNew ? "mt-6" : ""}`}
      >
        {tool.icon}
      </div>

      {/* Name */}
      <h3 className="mb-2 text-lg font-semibold text-(--th-fg-heading) transition-colors duration-200 group-hover:text-primary-400">
        {tool.name}
      </h3>

      {/* Description (clamp to 2 lines) */}
      <p className="mb-5 line-clamp-2 flex-1 text-sm leading-relaxed text-(--th-fg-muted)">
        {tool.description}
      </p>

      {/* Bottom arrow */}
      <span
        className={`text-sm font-medium ${c.text} flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
      >
        Open tool
        <svg
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature Card                                                      */
/* ------------------------------------------------------------------ */
const features = [
  {
    title: "100% Private",
    description:
      "All processing happens locally in your browser. Your files never leave your device.",
    icon: (
      <svg
        className="h-6 w-6 text-primary-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
  },
  {
    title: "Lightning Fast",
    description:
      "No server round-trips. Everything runs client-side using modern Web APIs.",
    icon: (
      <svg
        className="h-6 w-6 text-primary-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
        />
      </svg>
    ),
  },
  {
    title: "Always Free",
    description:
      "No signup. No limits. No premium tier. Every tool is completely free.",
    icon: (
      <svg
        className="h-6 w-6 text-primary-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
        />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  FAQ Item Props                                                    */
/* ------------------------------------------------------------------ */
interface FaqItem {
  question: string;
  answer: string;
}

/* ------------------------------------------------------------------ */
/*  Home Content (client component)                                   */
/* ------------------------------------------------------------------ */
export default function HomeContent({ faqItems }: { faqItems: FaqItem[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const searchRef = useRef<HTMLInputElement>(null);
  const categories = useMemo(() => getAllCategories(), []);

  /* Ctrl+K shortcut */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  /* Filter tools by category + search */
  const filteredTools = useMemo(() => {
    let result = tools;
    if (activeCategory !== "all") {
      result = result.filter((t) => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }
    return result;
  }, [activeCategory, search]);

  return (
    <div className="flex flex-col">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden border-b border-(--th-border) px-4 pb-20 pt-24 sm:pb-28 sm:pt-32">
        {/* Animated gradient blob — CSS only */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at center, #6366f1 0%, #8b5cf6 40%, transparent 70%)",
            animation: "heroBlob 8s ease-in-out infinite alternate",
          }}
        />

        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes heroBlob {
                0%   { transform: translateX(-50%) scale(1)   rotate(0deg);   }
                100% { transform: translateX(-50%) scale(1.1) rotate(3deg);   }
              }
              @keyframes staggerFadeIn {
                from { opacity: 0; transform: translateY(12px); }
                to   { opacity: 1; transform: translateY(0);    }
              }
              .stagger-card {
                animation: staggerFadeIn 0.4s ease-out both;
              }
            `,
          }}
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="bg-linear-to-r from-primary-400 via-accent-400 to-primary-400 bg-clip-text text-transparent">
              Free Developer Tools
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-(--th-fg-muted) sm:text-xl">
            10 essential tools that run 100% in your browser.
            <br className="hidden sm:block" /> No uploads. No tracking. No
            signup.
          </p>

          {/* Search bar */}
          <div className="mx-auto mb-8 max-w-xl">
            <div className="group relative">
              {/* Search icon */}
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-(--th-fg-faint) transition-colors duration-200 group-focus-within:text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>

              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tools..."
                className="w-full rounded-xl border border-(--th-border-hover) bg-(--th-pill-bg) py-3.5 pl-12 pr-20 text-base text-(--th-fg-heading) placeholder-(--th-fg-faint) outline-none transition-all duration-200 focus:border-primary-500/50 focus:bg-(--th-card-hover) focus:ring-2 focus:ring-primary-500/20"
              />

              {/* Keyboard shortcut hint */}
              <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 select-none items-center gap-0.5 rounded-md border border-(--th-border-hover) bg-(--th-pill-bg) px-2 py-1 font-mono text-[11px] text-(--th-fg-faint) sm:inline-flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#tools"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all duration-200 hover:bg-primary-600 hover:shadow-primary-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900"
            >
              Browse All Tools
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
                />
              </svg>
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-(--th-border-hover) bg-(--th-pill-bg) px-6 py-3 text-sm font-semibold text-(--th-fg) transition-all duration-200 hover:border-(--th-border-hover) hover:bg-(--th-btn-ghost-hover) hover:text-(--th-fg-heading) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TOOL GRID                                                   */}
      {/* ============================================================ */}
      <section id="tools" className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          {/* Section heading */}
          <div className="mb-10 flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-(--th-fg-heading)">All Tools</h2>
              <span className="rounded-full bg-primary-500/10 px-3 py-1 text-sm font-semibold text-primary-400">
                {tools.length}
              </span>
            </div>
            <p className="text-(--th-fg-faint)">
              Pick a category or search for what you need.
            </p>
          </div>

          {/* Category filter pills */}
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                activeCategory === "all"
                  ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                  : "bg-(--th-pill-bg) text-(--th-fg-muted) hover:bg-(--th-btn-ghost-hover) hover:text-(--th-fg-heading)"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  activeCategory === cat.category
                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                    : "bg-(--th-pill-bg) text-(--th-fg-muted) hover:bg-(--th-btn-ghost-hover) hover:text-(--th-fg-heading)"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((tool, i) => (
              <div key={tool.slug} className="stagger-card" style={{ animationDelay: `${i * 60}ms` }}>
                <ToolCard tool={tool} index={i} />
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredTools.length === 0 && (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-(--th-pill-bg) text-3xl">
                🔎
              </div>
              <p className="mb-1 text-lg font-medium text-(--th-fg-heading)">
                No tools found
              </p>
              <p className="text-sm text-(--th-fg-faint)">
                Try a different search term or category.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURES                                                    */}
      {/* ============================================================ */}
      <section className="border-t border-(--th-border) px-4 py-16 sm:py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-(--th-border) bg-linear-to-b from-(--th-pill-bg) to-transparent p-8"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/10">
                {f.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-(--th-fg-heading)">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-(--th-fg-muted)">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FAQ                                                         */}
      {/* ============================================================ */}
      <section className="border-t border-(--th-border) px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-(--th-fg-heading)">
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-(--th-border) bg-(--th-card) transition-colors duration-200 open:bg-(--th-card-hover) [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-base font-medium text-(--th-fg-heading) transition-colors duration-200 hover:text-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500">
                  {item.question}
                  <svg
                    className="h-5 w-5 shrink-0 text-(--th-fg-faint) transition-transform duration-200 group-open:rotate-45"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </summary>
                <div className="px-6 pb-5 text-sm leading-relaxed text-(--th-fg-muted)">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
