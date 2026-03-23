import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools-registry";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import ImageCompressor from "@/components/tools/ImageCompressor";

const SLUG = "image-compressor";

/* ================================================================== */
/*  Metadata — hand-tuned for long-tail SEO                           */
/* ================================================================== */

export function generateMetadata(): Metadata {
  const tool = getToolBySlug(SLUG);
  if (!tool) return {};

  const title =
    "Image Compressor — Compress PNG, JPG, WebP Online Free | DevToolkit";
  const description =
    "Compress images up to 90% smaller without visible quality loss. Supports PNG, JPG, JPEG, WebP. 100% browser-based — your images never leave your device.";
  const url = `${SITE_URL}/tools/${tool.slug}`;

  return {
    title,
    description,
    keywords: [
      "image compressor",
      "compress png",
      "compress jpg",
      "reduce image size",
      "image optimizer",
      "compress photo online free",
      "compress webp",
      "batch image compression",
      "resize image online",
      "reduce file size",
      "image compression tool",
      "optimize images for web",
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
      title: "Image Compressor — Compress PNG, JPG, WebP Online Free",
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
    q: "How does the image compressor work?",
    a: "The compressor uses the HTML Canvas API built into your browser. It decodes each image, optionally resizes it, then re-encodes it at your chosen quality level. Lower quality values produce smaller files with slightly reduced visual fidelity. All processing runs locally — your images are never uploaded to a server.",
  },
  {
    q: "Is this image compressor free?",
    a: "Yes, completely free with no limits. There is no signup, no watermarks, no file count restrictions, and no daily caps. Compress as many images as you need, as often as you want.",
  },
  {
    q: "What image formats are supported?",
    a: "The tool accepts PNG, JPG/JPEG, and WebP images up to 50 MB each. You can also convert between formats during compression — for example, compress a PNG as WebP for even smaller file sizes.",
  },
  {
    q: "Will I lose image quality?",
    a: "At the default 75% quality setting, the difference is virtually imperceptible for photographs. For pixel-perfect graphics or screenshots, try 85-95% quality. The before/after slider lets you compare results visually before downloading.",
  },
  {
    q: "Can I compress multiple images at once?",
    a: "Yes. Drop or select as many images as you like — they will be compressed sequentially to keep memory usage low. Once all images are processed, you can download them individually or as a single ZIP archive.",
  },
  {
    q: "Are my images safe?",
    a: "Absolutely. Every step — decoding, resizing, re-encoding — happens inside your browser using the Canvas API. No image data is ever sent over the network. Close the tab and the data is gone.",
  },
];

const pageUrl = `${SITE_URL}/tools/image-compressor`;

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Image Compressor",
  url: pageUrl,
  description:
    "Free online image compressor. Compress PNG, JPG, and WebP images up to 90% smaller without visible quality loss. 100% browser-based, private, and fast.",
  applicationCategory: "MultimediaApplication",
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
      name: "Image Compressor",
      item: pageUrl,
    },
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Compress Images Online",
  description:
    "Reduce image file sizes in 3 simple steps using our free browser-based compressor.",
  step: [
    {
      "@type": "HowToStep",
      name: "Upload your images",
      text: "Drag and drop PNG, JPG, or WebP images into the upload area, or click to browse. You can upload multiple files at once for batch compression.",
    },
    {
      "@type": "HowToStep",
      name: "Adjust settings",
      text: "Set the quality level (10-100%), choose an output format, and optionally set maximum dimensions to resize images during compression.",
    },
    {
      "@type": "HowToStep",
      name: "Download results",
      text: "Click Compress All, then compare before/after previews. Download images individually or all at once as a ZIP file.",
    },
  ],
};

/* ================================================================== */
/*  Page Component                                                     */
/* ================================================================== */

export default function ImageCompressorPage() {
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
        <ImageCompressor />

        {/* ============================================================ */}
        {/*  SEO Content — renders below the tool                        */}
        {/* ============================================================ */}

        {/* How to use */}
        <section className="mt-16 border-t border-(--th-border) pt-10">
          <h2 className="mb-6 text-xl font-bold text-(--th-fg-heading)">
            How to Compress Images Online
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Upload Your Images",
                desc: "Drag and drop PNG, JPG, or WebP images into the upload area. Batch upload is supported — add as many files as you need, up to 50 MB each.",
              },
              {
                step: "2",
                title: "Adjust Quality & Format",
                desc: "Use the quality slider to balance file size and visual fidelity. Optionally convert formats (e.g. PNG to WebP) or set max dimensions to resize during compression.",
              },
              {
                step: "3",
                title: "Compare & Download",
                desc: "Use the before/after slider to visually compare originals and compressed versions. Download individually or grab everything as a ZIP.",
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
                title: "Before / After Comparison",
                desc: "Drag the slider to visually compare your original and compressed images side by side. See exactly what you're trading for smaller file sizes.",
              },
              {
                title: "Batch Compression",
                desc: "Upload and compress dozens of images at once. Images are processed sequentially to keep your browser responsive and memory usage low.",
              },
              {
                title: "Format Conversion",
                desc: "Convert between PNG, JPEG, and WebP during compression. WebP typically delivers 25-35% smaller files than JPEG at the same visual quality.",
              },
              {
                title: "Smart Resizing",
                desc: "Set optional maximum width and height constraints. Images larger than the limits are proportionally scaled down; smaller images are left untouched.",
              },
              {
                title: "ZIP Download",
                desc: "Compressed a whole batch? Download every result as a single ZIP archive with one click — no need to save files one by one.",
              },
              {
                title: "100% Client-Side",
                desc: "All processing happens in your browser via the Canvas API. Your images are never uploaded anywhere — complete privacy guaranteed.",
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
            Why Compress Images?
          </h2>
          <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-(--th-fg-muted)">
            <p>
              <strong className="text-(--th-fg-heading)">Page speed matters.</strong>{" "}
              Images typically account for 50-70% of a web page&apos;s total weight.
              Compressing them is the single most impactful optimization you can
              make for faster load times, better Core Web Vitals scores, and
              higher search rankings.
            </p>
            <p>
              Modern lossy compression algorithms can reduce JPEG and WebP file
              sizes by 60-90% with virtually no perceptible loss in quality. The
              key is finding the right quality threshold for your content —
              photographs tolerate aggressive compression well, while text
              screenshots and pixel art need gentler settings.
            </p>
            <p>
              Our compressor uses the browser&apos;s native Canvas API for encoding,
              which means it leverages your device&apos;s hardware-accelerated image
              processing. The result is fast compression without installing any
              software, and complete privacy since your images never leave your
              machine.
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
