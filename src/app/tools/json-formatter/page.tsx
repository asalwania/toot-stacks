import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools-registry";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import JsonFormatter from "@/components/tools/JsonFormatter";

const SLUG = "json-formatter";

/* ================================================================== */
/*  Metadata — hand-tuned for long-tail SEO                           */
/* ================================================================== */

export function generateMetadata(): Metadata {
  const tool = getToolBySlug(SLUG);
  if (!tool) return {};

  const title =
    "JSON Formatter & Validator Online — Free JSON Beautifier, Minifier & Tree Viewer";
  const description =
    "Format, validate, beautify, and minify JSON instantly in your browser. Syntax highlighting, error detection with line numbers, collapsible tree view, and auto-formatting. 100% free, no signup, no data uploads.";
  const url = `${SITE_URL}/tools/${tool.slug}`;

  return {
    title,
    description,
    keywords: [
      "json formatter",
      "json validator",
      "json beautifier",
      "json minifier",
      "format json online",
      "json pretty print",
      "json tree viewer",
      "json syntax checker",
      "json lint",
      "validate json online",
      "minify json",
      "json editor online",
      "json formatter free",
      "json parser",
      "beautify json",
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
      title: "JSON Formatter & Validator — Free Online Tool",
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
/*  Structured Data — JSON-LD                                          */
/* ================================================================== */

const faqItems = [
  {
    q: "What is a JSON formatter?",
    a: "A JSON formatter is a tool that takes raw or minified JSON data and reformats it with proper indentation and line breaks, making it easy to read and debug. Our formatter also validates your JSON and highlights syntax errors with exact line and column numbers.",
  },
  {
    q: "Is this JSON formatter free to use?",
    a: "Yes, completely free with no limits. There is no signup, no account required, and no restrictions on how much JSON you can format. The tool runs entirely in your browser — your data is never sent to any server.",
  },
  {
    q: "Can I validate JSON with this tool?",
    a: "Absolutely. Switch to the Validate tab to check whether your JSON is valid. The validator reports the exact error location (line and column), the data type (object, array, string, etc.), and the number of keys or items.",
  },
  {
    q: "What is the difference between JSON formatting and minifying?",
    a: "Formatting (also called beautifying or pretty-printing) adds indentation and line breaks so JSON is human-readable. Minifying removes all unnecessary whitespace to reduce file size, which is useful for production APIs and network payloads.",
  },
  {
    q: "Does this tool work with large JSON files?",
    a: "Yes. The formatter handles large JSON documents efficiently because all processing happens client-side using native JavaScript JSON.parse and JSON.stringify. There is no file-size limit imposed by a server since nothing is uploaded.",
  },
  {
    q: "What is the JSON tree view?",
    a: "The tree view renders your JSON as a collapsible, hierarchical structure — similar to a file explorer. You can expand and collapse objects and arrays to navigate deeply nested data. Keys, strings, numbers, booleans, and null values are color-coded for quick scanning.",
  },
];

const pageUrl = `${SITE_URL}/tools/json-formatter`;

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "JSON Formatter & Validator",
  url: pageUrl,
  description:
    "Free online JSON formatter, validator, beautifier, minifier, and tree viewer. Runs 100% in your browser with syntax highlighting and error detection.",
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
      name: "JSON Formatter & Validator",
      item: pageUrl,
    },
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Format JSON Online",
  description:
    "Format, validate, and beautify JSON data in 3 simple steps using our free online tool.",
  step: [
    {
      "@type": "HowToStep",
      name: "Paste your JSON",
      text: 'Paste or type your raw JSON into the input editor on the left. The editor supports syntax highlighting and auto-indentation.',
    },
    {
      "@type": "HowToStep",
      name: "Choose an action",
      text: "Click Format to pretty-print with 2 or 4 spaces, Minify to compress, or switch to Validate or Tree View mode.",
    },
    {
      "@type": "HowToStep",
      name: "Copy the result",
      text: "The formatted output appears in the right panel with syntax highlighting. Click the Copy button to copy it to your clipboard.",
    },
  ],
};

/* ================================================================== */
/*  Page Component                                                     */
/* ================================================================== */

export default function JsonFormatterPage() {
  const tool = getToolBySlug(SLUG);
  if (!tool) notFound();

  return (
    <>
      {/* Structured data */}
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
        {/* The interactive tool */}
        <JsonFormatter />

        {/* ============================================================ */}
        {/*  SEO Content — renders below the tool                        */}
        {/* ============================================================ */}

        {/* How to use */}
        <section className="mt-16 border-t border-(--th-border) pt-10">
          <h2 className="mb-6 text-xl font-bold text-(--th-fg-heading)">
            How to Format JSON Online
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Paste Your JSON",
                desc: "Paste raw or minified JSON into the input editor. The VS Code-style editor provides syntax highlighting, auto-indentation, and bracket matching as you type.",
              },
              {
                step: "2",
                title: "Format, Minify, or Validate",
                desc: "Click Format to pretty-print with your preferred indentation (2 or 4 spaces). Use Minify to compress for production, or switch to Validate mode to check for errors.",
              },
              {
                step: "3",
                title: "Copy or Explore",
                desc: "Copy the formatted output with one click. Switch to Tree View to navigate deeply nested structures with collapsible nodes and color-coded values.",
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

        {/* Features grid */}
        <section className="mt-14 border-t border-(--th-border) pt-10">
          <h2 className="mb-6 text-xl font-bold text-(--th-fg-heading)">
            Features
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                title: "Syntax Highlighting",
                desc: "VS Code-inspired color scheme — keys, strings, numbers, booleans, and brackets are each uniquely colored for instant readability.",
              },
              {
                title: "Real-Time Validation",
                desc: "Errors are detected as you type with precise line and column numbers, so you can fix typos before they reach production.",
              },
              {
                title: "Smart Editor",
                desc: "Auto-close quotes and brackets, smart indentation on Enter, and Tab key support — just like your favorite code editor.",
              },
              {
                title: "Collapsible Tree View",
                desc: "Explore complex JSON hierarchies with expandable nodes. Quickly drill into nested objects and arrays without scrolling through raw text.",
              },
              {
                title: "Format & Minify",
                desc: "Pretty-print with 2 or 4 space indentation, or minify to a single line for smaller payloads and faster network transfers.",
              },
              {
                title: "100% Client-Side",
                desc: "All processing happens in your browser. Your data never leaves your device — no server uploads, no tracking, no cookies.",
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

        {/* What is JSON? — long-form content for SEO */}
        <section className="mt-14 border-t border-(--th-border) pt-10">
          <h2 className="mb-4 text-xl font-bold text-(--th-fg-heading)">
            What is JSON?
          </h2>
          <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-(--th-fg-muted)">
            <p>
              <strong className="text-(--th-fg-heading)">JSON (JavaScript Object Notation)</strong> is
              a lightweight, text-based data interchange format that is easy for
              humans to read and write, and easy for machines to parse and
              generate. It is the most widely used format for transmitting data
              between a server and a web application, and is the default format
              for REST APIs, configuration files, and NoSQL databases like
              MongoDB and CouchDB.
            </p>
            <p>
              JSON supports six data types: <strong className="text-(--th-fg-heading)">strings</strong>,{" "}
              <strong className="text-(--th-fg-heading)">numbers</strong>,{" "}
              <strong className="text-(--th-fg-heading)">booleans</strong> (true/false),{" "}
              <strong className="text-(--th-fg-heading)">null</strong>,{" "}
              <strong className="text-(--th-fg-heading)">objects</strong> (key-value pairs enclosed
              in curly braces), and{" "}
              <strong className="text-(--th-fg-heading)">arrays</strong> (ordered lists enclosed in
              square brackets). Unlike XML, JSON has no closing tags, no
              attributes, and no namespaces — making it significantly more
              compact and faster to parse.
            </p>
            <p>
              Common use cases include API responses, application configuration
              (package.json, tsconfig.json), browser localStorage, log
              aggregation, and data pipelines. A JSON formatter helps developers
              quickly inspect, debug, and clean up JSON data during development
              and testing workflows.
            </p>
          </div>
        </section>

        {/* FAQ section */}
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
