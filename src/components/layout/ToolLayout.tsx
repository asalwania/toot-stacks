import Link from "next/link";
import { tools } from "@/lib/tools-registry";
import AdSlot from "@/components/layout/AdSlot";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function getRelatedTools(currentTitle: string, count = 3) {
  const filtered = tools.filter((t) => t.name !== currentTitle);
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
  const relatedTools = getRelatedTools(title);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          <li>
            <Link
              href="/"
              className="transition-colors hover:text-zinc-900 dark:hover:text-white"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </li>
          <li>
            <Link
              href="/#tools"
              className="transition-colors hover:text-zinc-900 dark:hover:text-white"
            >
              Tools
            </Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </li>
          <li>
            <span className="font-medium text-zinc-900 dark:text-white">{title}</span>
          </li>
        </ol>
      </nav>

      {/* Top Ad */}
      <div className="mb-6 flex justify-center">
        <AdSlot variant="leaderboard" />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>

      {/* Content + Sidebar */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main Content */}
        <div className="min-w-0 flex-1">{children}</div>

        {/* Sidebar Ad (desktop only) */}
        <aside className="hidden shrink-0 lg:block">
          <div className="sticky top-24">
            <AdSlot variant="rectangle" />
          </div>
        </aside>
      </div>

      {/* Related Tools */}
      <section className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Related Tools
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {relatedTools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              className="group rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-lg dark:bg-zinc-800">
                {tool.icon}
              </div>
              <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                {tool.shortName}
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
