import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools-registry";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import ImageConverter from "@/components/tools/ImageConverter";

const SLUG = "image-converter";

/* ================================================================== */
/*  Metadata — hand-tuned for long-tail SEO                           */
/* ================================================================== */

export function generateMetadata(): Metadata {
  const tool = getToolBySlug(SLUG);
  if (!tool) return {};

  const title =
    "Image Converter \u2014 Convert PNG, JPG, WebP, BMP, SVG Online Free | DevToolkit";
  const description =
    "Convert images between PNG, JPG, WebP, BMP, GIF, and ICO formats instantly. Batch convert multiple files. Free, runs entirely in your browser.";
  const url = `${SITE_URL}/tools/${tool.slug}`;

  return {
    title,
    description,
    keywords: [
      "image converter",
      "png to jpg",
      "jpg to webp",
      "webp to png",
      "convert image format",
      "heic to jpg",
      "image format converter online free",
      "png to ico",
      "batch image converter",
      "svg to png",
      "bmp converter",
      "image format changer",
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
      title: "Image Converter \u2014 Convert PNG, JPG, WebP, BMP Online Free",
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
    q: "What image formats can I convert between?",
    a: "You can convert between PNG, JPEG, WebP, BMP, GIF, SVG, and ICO formats. The tool accepts all major browser-supported image types and can output to PNG, JPEG, WebP, BMP, or ICO.",
  },
  {
    q: "Is this image converter free?",
    a: "Yes, completely free with no limits. There is no signup, no watermarks, no file count restrictions, and no daily caps. Convert as many images as you need.",
  },
  {
    q: "Are my images uploaded to a server?",
    a: "No. All conversion happens locally in your browser using the Canvas API. Your images never leave your device \u2014 complete privacy guaranteed.",
  },
  {
    q: "Can I convert PNG to ICO for favicons?",
    a: "Yes! Select ICO as the output format and the tool will generate a multi-size .ico file containing 16\u00d716, 32\u00d732, 48\u00d748, and 64\u00d764 pixel versions \u2014 perfect for website favicons.",
  },
  {
    q: "Can I batch convert multiple images at once?",
    a: "Yes. Drop or select as many images as you like. They will be converted sequentially and you can download them individually or as a single ZIP archive.",
  },
  {
    q: "Will I lose quality when converting?",
    a: "Lossless formats like PNG preserve all image data. For lossy formats (JPEG, WebP), use the quality slider to balance file size and fidelity \u2014 90% quality is virtually indistinguishable from the original for most images.",
  },
];

const pageUrl = `${SITE_URL}/tools/image-converter`;

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Image Format Converter",
  url: pageUrl,
  description:
    "Free online image format converter. Convert between PNG, JPG, WebP, BMP, GIF, SVG, and ICO formats instantly in your browser.",
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
      name: "Image Format Converter",
      item: pageUrl,
    },
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Convert Image Formats Online",
  description:
    "Convert images between formats in 3 simple steps using our free browser-based converter.",
  step: [
    {
      "@type": "HowToStep",
      name: "Upload your images",
      text: "Drag and drop PNG, JPG, WebP, BMP, GIF, or SVG images into the upload area. You can upload multiple files at once for batch conversion.",
    },
    {
      "@type": "HowToStep",
      name: "Choose output format",
      text: "Select the target format (PNG, JPEG, WebP, BMP, or ICO). For JPEG and WebP, adjust the quality slider. Optionally enable resizing with aspect ratio lock.",
    },
    {
      "@type": "HowToStep",
      name: "Download results",
      text: "Click Convert All, then download converted images individually or all at once as a ZIP file.",
    },
  ],
};

/* ================================================================== */
/*  Page Component                                                     */
/* ================================================================== */

export default function ImageConverterPage() {
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
        <ImageConverter />

        {/* ============================================================ */}
        {/*  SEO Content — renders below the tool                        */}
        {/* ============================================================ */}

        {/* How to use */}
        <section className="mt-16 border-t border-(--th-border) pt-10">
          <h2 className="mb-6 text-xl font-bold text-(--th-fg-heading)">
            How to Convert Image Formats Online
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Upload Your Images",
                desc: "Drag and drop PNG, JPG, WebP, BMP, GIF, or SVG images into the upload area. Batch upload is supported \u2014 add as many files as you need, up to 50 MB each.",
              },
              {
                step: "2",
                title: "Choose Format & Settings",
                desc: "Select your target format from PNG, JPEG, WebP, BMP, or ICO. For lossy formats, adjust the quality slider. Optionally resize images with the aspect ratio lock.",
              },
              {
                step: "3",
                title: "Download Results",
                desc: "Click Convert All to process your images. Download them individually or grab everything as a ZIP archive with one click.",
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
                title: "Batch Conversion",
                desc: "Upload and convert dozens of images at once. Images are processed sequentially to keep your browser responsive and memory usage low.",
              },
              {
                title: "Quick Preset Shortcuts",
                desc: "One-click presets for the most common conversions: PNG to JPG, JPG to WebP, WebP to PNG, and more. No settings to configure.",
              },
              {
                title: "ICO Favicon Generator",
                desc: "Convert any image to a multi-size .ico file containing 16\u00d716, 32\u00d732, 48\u00d748, and 64\u00d764 pixel versions \u2014 ready to use as a website favicon.",
              },
              {
                title: "Quality Control",
                desc: "Fine-tune JPEG and WebP output quality from 10% to 100%. Find the perfect balance between file size and visual fidelity for your use case.",
              },
              {
                title: "Resize with Aspect Lock",
                desc: "Optionally resize images during conversion. The aspect ratio lock keeps proportions perfect, or unlock it for custom dimensions.",
              },
              {
                title: "100% Client-Side",
                desc: "All processing happens in your browser via the Canvas API. Your images are never uploaded anywhere \u2014 complete privacy guaranteed.",
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
            When to Convert Image Formats
          </h2>
          <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-(--th-fg-muted)">
            <p>
              <strong className="text-(--th-fg-heading)">
                Different formats for different jobs.
              </strong>{" "}
              PNG is ideal for screenshots, logos, and graphics with transparency.
              JPEG excels at photographs with its efficient lossy compression.
              WebP delivers 25-35% smaller files than JPEG at equivalent quality,
              making it the go-to for modern web assets.
            </p>
            <p>
              Converting PNG screenshots to JPEG before sharing can reduce file
              sizes by 70-90%. Switching from JPEG to WebP for web images improves
              page load times and Core Web Vitals scores. And generating ICO files
              from high-res logos gives you pixel-perfect favicons at every size.
            </p>
            <p>
              Our converter uses the browser&apos;s native Canvas API for encoding,
              which means it leverages your device&apos;s hardware-accelerated image
              processing. The result is fast, private conversion without installing
              any software or uploading your images to a server.
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
