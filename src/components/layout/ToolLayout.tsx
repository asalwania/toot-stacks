import Link from "next/link";
import { tools as allTools, type Tool } from "@/lib/tools-registry";
import AdSlot from "@/components/layout/AdSlot";

interface ToolLayoutProps {
  tool: Tool;
  children: React.ReactNode;
}

const colorMap: Record<string, { bg: string; text: string }> = {
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-400" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  teal:    { bg: "bg-teal-500/10",    text: "text-teal-400" },
  orange:  { bg: "bg-orange-500/10",  text: "text-orange-400" },
  red:     { bg: "bg-red-500/10",     text: "text-red-400" },
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-400" },
  pink:    { bg: "bg-pink-500/10",    text: "text-pink-400" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-400" },
  cyan:    { bg: "bg-cyan-500/10",    text: "text-cyan-400" },
  lime:    { bg: "bg-lime-500/10",    text: "text-lime-400" },
  rose:    { bg: "bg-rose-500/10",    text: "text-rose-400" },
  indigo:  { bg: "bg-indigo-500/10",  text: "text-indigo-400" },
};

function getRelatedTools(tool: Tool, count = 3): Tool[] {
  const registry = allTools ?? [];
  const sameCategory = registry.filter(
    (t) => t.category === tool.category && t.id !== tool.id
  );
  if (sameCategory.length >= count) return sameCategory.slice(0, count);
  const others = registry.filter(
    (t) => t.id !== tool.id && t.category !== tool.category
  );
  return [...sameCategory, ...others].slice(0, count);
}

export default function ToolLayout({ tool, children }: ToolLayoutProps) {
  const related = getRelatedTools(tool);
  const c = colorMap[tool.color] ?? colorMap.blue;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* ---- Breadcrumb ---- */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-(--th-fg-faint)">
          <li>
            <Link
              href="/"
              className="transition-colors duration-200 hover:text-(--th-fg-heading) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:rounded"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <svg
              className="h-3.5 w-3.5 text-(--th-fg-faint)"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </li>
          <li>
            <Link
              href="/#tools"
              className="transition-colors duration-200 hover:text-(--th-fg-heading) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:rounded"
            >
              Tools
            </Link>
          </li>
          <li aria-hidden="true">
            <svg
              className="h-3.5 w-3.5 text-(--th-fg-faint)"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </li>
          <li>
            <span className="font-medium text-(--th-fg-heading)">{tool.name}</span>
          </li>
        </ol>
      </nav>

      {/* ---- Tool header ---- */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${c.bg}`}
        >
          {tool.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-(--th-fg-heading) sm:text-3xl">
              {tool.name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${c.bg} ${c.text}`}
            >
              {tool.categoryLabel}
            </span>
            {tool.isNew && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                NEW
              </span>
            )}
          </div>
          <p className="mt-2 text-base leading-relaxed text-(--th-fg-muted)">
            {tool.description}
          </p>
        </div>
      </div>

      {/* ---- Top Ad ---- */}
      <div className="mb-8 flex justify-center">
        <AdSlot variant="leaderboard" />
      </div>

      {/* ---- Tool content ---- */}
      <div className="min-w-0">{children}</div>

      {/* ---- Bottom Ad ---- */}
      <div className="mt-10 flex justify-center">
        <AdSlot variant="banner" />
      </div>

      {/* ---- Related Tools ---- */}
      {related.length > 0 && (
        <section className="mt-14 border-t border-(--th-border) pt-10">
          <h2 className="mb-5 text-lg font-semibold text-(--th-fg-heading)">
            Related Tools
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => {
              const rc = colorMap[r.color] ?? colorMap.blue;
              return (
                <Link
                  key={r.id}
                  href={`/tools/${r.slug}`}
                  className="group rounded-2xl border border-(--th-border) bg-(--th-card) p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-(--th-border-hover) hover:bg-(--th-card-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <div
                    className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-lg ${rc.bg}`}
                  >
                    {r.icon}
                  </div>
                  <h3 className="font-semibold text-(--th-fg-heading) transition-colors duration-200 group-hover:text-primary-400">
                    {r.shortName}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-(--th-fg-faint)">
                    {r.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ---- SEO content ---- */}
      <section className="mt-14 border-t border-(--th-border) pt-10">
        <h2 className="mb-3 text-lg font-semibold text-(--th-fg-heading)">
          About {tool.name}
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-(--th-fg-muted)">
          {tool.longDescription}
        </p>
      </section>

      {/* ---- Back link ---- */}
      <div className="mt-10 border-t border-(--th-border) pt-8">
        <Link
          href="/#tools"
          className="inline-flex items-center gap-2 text-sm font-medium text-(--th-fg-muted) transition-colors duration-200 hover:text-(--th-fg-heading) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
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
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to all tools
        </Link>
      </div>
    </div>
  );
}
