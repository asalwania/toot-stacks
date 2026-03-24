import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools-registry";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import PdfTools from "@/components/tools/PdfTools";

const SLUG = "pdf-tools";

/* ================================================================== */
/*  Metadata — hand-tuned for long-tail SEO                           */
/* ================================================================== */

export function generateMetadata(): Metadata {
  const tool = getToolBySlug(SLUG);
  if (!tool) return {};

  const title =
    "PDF Tools — Merge, Compress & Split PDF Online Free | DevToolkit";
  const description =
    "Merge multiple PDFs into one, compress PDF file size, or split PDFs by page range. 100% browser-based — your documents never leave your device.";
  const url = `${SITE_URL}/tools/${tool.slug}`;

  return {
    title,
    description,
    keywords: [
      "merge pdf",
      "combine pdf",
      "compress pdf",
      "split pdf",
      "pdf merger online free",
      "reduce pdf size",
      "pdf splitter",
      "pdf compressor",
      "split pdf by pages",
      "merge pdf files",
      "pdf tools online",
      "combine pdf files free",
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
      title: "PDF Tools — Merge, Compress & Split PDF Online Free",
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
    q: "How does the PDF merger work?",
    a: "The merger uses the pdf-lib library running entirely in your browser. It loads each PDF, copies all pages in the order you specify, and combines them into a single document. Your files are never uploaded to a server — everything is processed locally on your device.",
  },
  {
    q: "Is there a file size limit?",
    a: "There is no hard limit, but very large PDFs (100 MB+) may slow down your browser since all processing happens client-side. For best results, keep individual files under 50 MB. There are no restrictions on the number of files you can merge.",
  },
  {
    q: "How effective is the PDF compression?",
    a: "Browser-based compression removes metadata, unused objects, and can re-encode embedded images at lower quality. Typical savings range from 5-40% depending on PDF content. For maximum compression, server-side tools like Ghostscript are more effective, but our tool works well for quick reductions without uploading sensitive documents.",
  },
  {
    q: "Can I split a PDF into individual pages?",
    a: "Yes. The Split tab offers three modes: extract specific pages by number or range (e.g. 1, 3, 5-8), split every N pages into separate files, or split into individual single-page PDFs. Multiple output files are bundled into a ZIP download.",
  },
  {
    q: "Are my documents safe?",
    a: "Absolutely. All processing happens inside your browser using JavaScript. No PDF data is ever sent to a server. Close the tab and all data is gone. This makes our tool ideal for confidential or sensitive documents.",
  },
  {
    q: "What about password-protected PDFs?",
    a: "The tool attempts to load password-protected PDFs by ignoring encryption, which works for PDFs with owner passwords (editing restrictions). User-password-protected PDFs (that require a password to open) cannot be processed — you will see an error message in that case.",
  },
];

const pageUrl = `${SITE_URL}/tools/pdf-tools`;

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PDF Tools — Merge, Compress & Split",
  url: pageUrl,
  description:
    "Free online PDF tools. Merge multiple PDFs, compress file sizes, and split documents by page range. 100% browser-based, private, and fast.",
  applicationCategory: "BusinessApplication",
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
      name: "PDF Tools",
      item: pageUrl,
    },
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Merge, Compress & Split PDFs Online",
  description:
    "Use our free browser-based PDF tools to merge, compress, or split PDF documents in seconds.",
  step: [
    {
      "@type": "HowToStep",
      name: "Choose an operation",
      text: "Select the Merge, Compress, or Split tab depending on what you need to do with your PDF files.",
    },
    {
      "@type": "HowToStep",
      name: "Upload your PDFs",
      text: "Drag and drop PDF files into the upload area or click to browse. For merging, add multiple files and reorder them as needed.",
    },
    {
      "@type": "HowToStep",
      name: "Configure and process",
      text: "Adjust settings like compression level or page ranges, then click the action button. Processing happens instantly in your browser.",
    },
    {
      "@type": "HowToStep",
      name: "Download results",
      text: "Download your merged, compressed, or split PDF files. Multiple split files are bundled into a convenient ZIP archive.",
    },
  ],
};

/* ================================================================== */
/*  Page Component                                                     */
/* ================================================================== */

export default function PdfToolsPage() {
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
        <PdfTools />

        {/* ============================================================ */}
        {/*  SEO Content — renders below the tool                        */}
        {/* ============================================================ */}

        {/* How to use */}
        <section className="mt-16 border-t border-(--th-border) pt-10">
          <h2 className="mb-6 text-xl font-bold text-(--th-fg-heading)">
            How to Use PDF Tools
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Choose Your Operation",
                desc: "Select Merge to combine multiple PDFs, Compress to reduce file size, or Split to extract specific pages or divide a document into parts.",
              },
              {
                step: "2",
                title: "Upload & Configure",
                desc: "Drag and drop your PDF files into the upload zone. For merging, reorder files by dragging. For splitting, enter page ranges. For compression, pick a preset level.",
              },
              {
                step: "3",
                title: "Process & Download",
                desc: "Click the action button and wait a few seconds. Download your result as a single PDF or a ZIP archive containing multiple files.",
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
                title: "Merge Multiple PDFs",
                desc: "Combine any number of PDF files into a single document. Drag to reorder, move files up/down, and preview page counts before merging.",
              },
              {
                title: "Smart Compression",
                desc: "Three compression presets — Light, Medium, and Heavy — let you balance file size reduction against quality. Removes metadata and re-encodes embedded images.",
              },
              {
                title: "Flexible Page Splitting",
                desc: "Extract specific pages by number or range, split every N pages, or create individual single-page PDFs. Multiple outputs download as a ZIP.",
              },
              {
                title: "Page Thumbnails",
                desc: "Preview the first and last pages of uploaded PDFs as thumbnails rendered via the HTML Canvas API, so you always know what you're working with.",
              },
              {
                title: "Drag & Drop Reordering",
                desc: "Reorder PDF files before merging with intuitive drag-and-drop. Accessibility-friendly move up/down buttons are also provided.",
              },
              {
                title: "100% Client-Side",
                desc: "All processing happens in your browser using the pdf-lib library. Your documents are never uploaded anywhere — complete privacy guaranteed.",
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

        {/* Long-form SEO content */}
        <section className="mt-14 border-t border-(--th-border) pt-10">
          <h2 className="mb-4 text-xl font-bold text-(--th-fg-heading)">
            Why Use Browser-Based PDF Tools?
          </h2>
          <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-(--th-fg-muted)">
            <p>
              <strong className="text-(--th-fg-heading)">Privacy first.</strong>{" "}
              Most online PDF tools require uploading your documents to their
              servers. That&apos;s a dealbreaker for contracts, financial
              statements, medical records, or any sensitive content. Our tools
              process everything locally in your browser — your files never leave
              your device.
            </p>
            <p>
              PDF merging is essential when you need to combine scanned
              documents, assemble report sections, or bundle invoices. Our merger
              preserves page dimensions, bookmarks, and internal links while
              letting you reorder files with drag-and-drop.
            </p>
            <p>
              Browser-based compression is ideal for quick size reductions —
              stripping metadata, unused objects, and re-encoding images
              typically saves 10-30%. For PDFs heavy on scanned images,
              server-side tools like Ghostscript can achieve deeper compression,
              but our tool handles the common case without any software
              installation.
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
