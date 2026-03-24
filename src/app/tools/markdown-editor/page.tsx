import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools-registry";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import MarkdownEditor from "@/components/tools/MarkdownEditor";

const SLUG = "markdown-editor";

/* ================================================================== */
/*  Metadata                                                            */
/* ================================================================== */

export function generateMetadata(): Metadata {
  const tool = getToolBySlug(SLUG);
  if (!tool) return {};

  const title =
    "Markdown Editor & Live Previewer — Free Online WYSIWYG Markdown Tool";
  const description =
    "Write Markdown with a live side-by-side preview, formatting toolbar, GitHub Flavored Markdown support, and HTML export. 100% free, no signup, runs entirely in your browser.";
  const url = `${SITE_URL}/tools/${tool.slug}`;

  return {
    title,
    description,
    keywords: [
      "markdown editor",
      "markdown preview",
      "markdown viewer",
      "markdown to html",
      "online markdown editor",
      "markdown live preview",
      "github markdown",
      "gfm editor",
      "markdown formatter",
      "wysiwyg markdown",
      "markdown editor free",
      "markdown table generator",
    ],
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: `${SITE_URL}/og/${tool.slug}.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Markdown Editor — Free Online Live Preview Tool",
      description,
      images: [`${SITE_URL}/og/${tool.slug}.png`],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}

/* ================================================================== */
/*  Structured Data                                                     */
/* ================================================================== */

const faqItems = [
  {
    q: "What is a Markdown editor?",
    a: "A Markdown editor lets you write content using Markdown syntax — a lightweight markup language — and see the formatted result in real time. It is widely used for documentation, README files, blog posts, and notes.",
  },
  {
    q: "Is this Markdown editor free?",
    a: "Yes, it is completely free with no limits or signup required. All processing happens in your browser — your content is never uploaded to any server.",
  },
  {
    q: "Does it support GitHub Flavored Markdown (GFM)?",
    a: "Yes. The editor supports GFM extensions including tables, task lists, strikethrough, fenced code blocks, and autolinks.",
  },
  {
    q: "Can I export my Markdown as HTML?",
    a: "Absolutely. Click 'Export HTML' to download a fully styled HTML file, or use 'Copy HTML' to copy the raw HTML markup to your clipboard.",
  },
  {
    q: "Are there keyboard shortcuts?",
    a: "Yes — Ctrl+B for bold, Ctrl+I for italic, and Tab for indentation. The toolbar also shows shortcut hints on hover.",
  },
];

const pageUrl = `${SITE_URL}/tools/markdown-editor`;

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Markdown Editor & Live Previewer",
  url: pageUrl,
  description:
    "Free online Markdown editor with live side-by-side preview, formatting toolbar, GFM support, and HTML export. Runs 100% in your browser.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  browserRequirements: "Requires a modern web browser with JavaScript enabled",
  softwareVersion: "1.0",
  creator: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Tools",
      item: `${SITE_URL}/#tools`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Markdown Editor",
      item: pageUrl,
    },
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Write and Preview Markdown Online",
  description:
    "Write, format, and preview Markdown in 3 simple steps using our free online editor.",
  step: [
    {
      "@type": "HowToStep",
      name: "Write your Markdown",
      text: "Type or paste Markdown in the editor pane. Use the toolbar for quick formatting like headings, bold, lists, links, and tables.",
    },
    {
      "@type": "HowToStep",
      name: "Preview in real time",
      text: "The rendered preview updates instantly as you type, showing exactly how your Markdown will look when published.",
    },
    {
      "@type": "HowToStep",
      name: "Export or copy",
      text: "Copy the raw Markdown, copy the rendered HTML, or download a fully styled HTML file ready to share or publish.",
    },
  ],
};

/* ================================================================== */
/*  Page Component                                                      */
/* ================================================================== */

export default function MarkdownEditorPage() {
  const tool = getToolBySlug(SLUG);
  if (!tool) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <ToolLayout tool={tool}>
        <MarkdownEditor />

        {/* How to use */}
        <section className="mt-16 border-t border-(--th-border) pt-10">
          <h2 className="mb-6 text-xl font-bold text-(--th-fg-heading)">
            How to Use the Markdown Editor
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Write Markdown",
                desc: "Type or paste Markdown into the editor. Use the toolbar for quick formatting — bold, italic, headings, links, code blocks, tables, and more.",
              },
              {
                step: "2",
                title: "Preview Instantly",
                desc: "See the rendered output update in real time in the preview pane. Toggle between split, editor-only, or preview-only views.",
              },
              {
                step: "3",
                title: "Export & Share",
                desc: "Copy the raw Markdown, copy the HTML output, or download a fully styled HTML file ready to publish or share.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-(--th-border) bg-(--th-card) p-6"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-sm font-bold text-primary-400">
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold text-(--th-fg-heading)">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-(--th-fg-muted)">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mt-14 border-t border-(--th-border) pt-10">
          <h2 className="mb-6 text-xl font-bold text-(--th-fg-heading)">
            Features
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                title: "Live Side-by-Side Preview",
                desc: "See your Markdown rendered in real time as you type. The split view keeps your source and output visible simultaneously.",
              },
              {
                title: "Rich Formatting Toolbar",
                desc: "One-click buttons for headings, bold, italic, links, images, code, lists, task lists, tables, blockquotes, and horizontal rules.",
              },
              {
                title: "GitHub Flavored Markdown",
                desc: "Full GFM support including tables, task lists, strikethrough, fenced code blocks, and autolinks.",
              },
              {
                title: "Keyboard Shortcuts",
                desc: "Ctrl+B for bold, Ctrl+I for italic, Tab for indentation — the keyboard shortcuts you already know.",
              },
              {
                title: "Export Options",
                desc: "Copy raw Markdown, copy rendered HTML, or download a complete HTML file with embedded styling.",
              },
              {
                title: "100% Client-Side",
                desc: "Everything runs in your browser. Your content never leaves your device — no server uploads, no tracking, no cookies.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-(--th-border) bg-(--th-card) p-5"
              >
                <h3 className="mb-1.5 text-sm font-semibold text-(--th-fg-heading)">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-(--th-fg-muted)">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* What is Markdown? */}
        <section className="mt-14 border-t border-(--th-border) pt-10">
          <h2 className="mb-4 text-xl font-bold text-(--th-fg-heading)">
            What is Markdown?
          </h2>
          <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-(--th-fg-muted)">
            <p>
              <strong className="text-(--th-fg-heading)">Markdown</strong> is a
              lightweight markup language created by John Gruber in 2004. It lets
              you write formatted content using plain text syntax that is easy to
              read and write. Markdown is the standard for README files, developer
              documentation, static site generators, note-taking apps, and online
              forums.
            </p>
            <p>
              Common syntax includes{" "}
              <strong className="text-(--th-fg-heading)"># headings</strong>,{" "}
              <strong className="text-(--th-fg-heading)">**bold**</strong>,{" "}
              <strong className="text-(--th-fg-heading)">*italic*</strong>,{" "}
              <strong className="text-(--th-fg-heading)">[links](url)</strong>,{" "}
              <strong className="text-(--th-fg-heading)">![images](url)</strong>,
              code blocks with triple backticks, and bullet or numbered lists.
              GitHub Flavored Markdown (GFM) adds tables, task lists, and
              strikethrough.
            </p>
            <p>
              A Markdown editor with live preview removes the guesswork — you see
              exactly how your content will render as you write, making it ideal
              for both beginners learning the syntax and experienced developers
              writing documentation.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14 border-t border-(--th-border) pt-10">
          <h2 className="mb-6 text-xl font-bold text-(--th-fg-heading)">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-(--th-border) bg-(--th-card) transition-colors duration-200 open:bg-(--th-card-hover) [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-(--th-fg-heading) transition-colors duration-200 hover:text-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500">
                  {item.q}
                  <svg
                    className="h-4 w-4 shrink-0 text-(--th-fg-faint) transition-transform duration-200 group-open:rotate-45"
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
                <div className="px-5 pb-4 text-sm leading-relaxed text-(--th-fg-muted)">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      </ToolLayout>
    </>
  );
}
