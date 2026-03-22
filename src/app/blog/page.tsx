import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Tips, tutorials, and updates from the WebToolkit team. Learn how to make the most of our developer tools.",
};

const upcomingArticles = [
  {
    title: "Mastering Regular Expressions: A Practical Guide",
    description:
      "Learn the most common regex patterns every developer should know, with interactive examples.",
    category: "Tutorial",
    date: "Coming Soon",
  },
  {
    title: "Why Client-Side Tools Matter for Privacy",
    description:
      "A deep dive into how browser-based tools protect your data compared to server-side alternatives.",
    category: "Privacy",
    date: "Coming Soon",
  },
  {
    title: "Optimizing Images for the Web in 2026",
    description:
      "Modern formats, compression strategies, and automation tips to keep your site blazing fast.",
    category: "Performance",
    date: "Coming Soon",
  },
];

export default function BlogPage() {
  return (
    <div className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
            Blog
          </h1>
          <p className="text-lg text-muted-foreground">
            Tips, tutorials, and updates from the WebToolkit team.
          </p>
        </div>

        <div className="mb-12 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            Coming Soon
          </h2>
          <p className="text-muted-foreground">
            We are working on our first batch of articles. Check back soon for
            developer tips, tool guides, and more.
          </p>
        </div>

        <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Upcoming Articles
        </h3>

        <div className="space-y-6">
          {upcomingArticles.map((article) => (
            <article
              key={article.title}
              className="rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-border"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {article.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {article.date}
                </span>
              </div>
              <h4 className="mb-2 text-lg font-semibold text-foreground">
                {article.title}
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {article.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
