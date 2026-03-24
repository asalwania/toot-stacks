import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools-registry";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import ToolLayout from "@/components/layout/ToolLayout";
import YouTubeTranscript from "@/components/tools/YouTubeTranscript";

const SLUG = "youtube-transcript-generator";

/* ================================================================== */
/*  Metadata — hand-tuned for long-tail SEO                           */
/* ================================================================== */

export function generateMetadata(): Metadata {
  const tool = getToolBySlug(SLUG);
  if (!tool) return {};

  const title =
    "YouTube Transcript Generator — Free Online Tool | Extract Video Captions Instantly";
  const description =
    "Extract and download YouTube video transcripts instantly. Copy captions, search inside transcripts, toggle timestamps, and download as .txt — 100% free, no signup required.";
  const url = `${SITE_URL}/tools/${tool.slug}`;

  return {
    title,
    description,
    keywords: [
      "youtube transcript generator",
      "youtube transcript",
      "extract youtube captions",
      "youtube subtitles",
      "youtube to text",
      "download youtube transcript",
      "video transcript",
      "youtube captions extractor",
      "youtube transcript downloader",
      "free transcript tool",
      "youtube video to text",
      "copy youtube subtitles",
      "get youtube transcript",
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
      title: "YouTube Transcript Generator — Free Online Tool",
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
    q: "What is a YouTube Transcript Generator?",
    a: "A YouTube Transcript Generator is a tool that extracts the captions or subtitles from a YouTube video and displays them as readable text. You can copy, search, and download the transcript for note-taking, content repurposing, SEO, and accessibility.",
  },
  {
    q: "Is this YouTube transcript tool free?",
    a: "Yes, completely free with no limits. There is no signup, no account required, and no restrictions on how many transcripts you can extract. Simply paste a YouTube URL and get the transcript instantly.",
  },
  {
    q: "What YouTube URL formats are supported?",
    a: "We support all common YouTube URL formats including youtube.com/watch?v=, youtu.be/ short links, youtube.com/embed/, youtube.com/shorts/, and direct 11-character video IDs.",
  },
  {
    q: "Why is no transcript available for some videos?",
    a: "Not all YouTube videos have captions. Transcripts are only available for videos where the uploader has enabled auto-generated or manually added subtitles. Live streams and some private videos may also not have captions available.",
  },
  {
    q: "Can I download the transcript?",
    a: "Yes! After extracting the transcript, click the 'Download .txt' button to save it as a plain text file. You can also toggle timestamps on or off before downloading.",
  },
  {
    q: "Can I search inside the transcript?",
    a: "Absolutely. Use the search bar above the transcript to filter and highlight specific words or phrases in real time. This is perfect for finding key moments in long videos.",
  },
  {
    q: "Does this tool work with auto-generated captions?",
    a: "Yes, the tool works with both manually added and auto-generated YouTube captions. Auto-generated captions may have some inaccuracies since they are produced by speech recognition technology.",
  },
];

const pageUrl = `${SITE_URL}/tools/youtube-transcript-generator`;

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "YouTube Transcript Generator",
  url: pageUrl,
  description:
    "Free online tool to extract, search, and download YouTube video transcripts with timestamps. Fast, easy to use, no signup required.",
  applicationCategory: "UtilitiesApplication",
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
      name: "YouTube Transcript Generator",
      item: pageUrl,
    },
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Extract a YouTube Transcript",
  description:
    "Extract a YouTube video transcript in 3 simple steps using our free online tool.",
  step: [
    {
      "@type": "HowToStep",
      name: "Paste the YouTube URL",
      text: "Copy the YouTube video URL from your browser and paste it into the input field. We support all YouTube URL formats including standard watch links, short links, and embed URLs.",
    },
    {
      "@type": "HowToStep",
      name: "Click Get Transcript",
      text: "Click the 'Get Transcript' button to extract the video's captions. The transcript will appear below with timestamps and segment markers.",
    },
    {
      "@type": "HowToStep",
      name: "Copy or download the transcript",
      text: "Use the Copy button to copy the full transcript to your clipboard, or click Download .txt to save it as a file. Toggle timestamps on or off, and use the search bar to find specific content.",
    },
  ],
};

/* ================================================================== */
/*  Page Component                                                     */
/* ================================================================== */

export default function YouTubeTranscriptPage() {
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
        <YouTubeTranscript />

        {/* ============================================================ */}
        {/*  SEO Content — renders below the tool                        */}
        {/* ============================================================ */}

        {/* How to use */}
        <section className="mt-16 border-t border-(--th-border) pt-10">
          <h2 className="mb-6 text-xl font-bold text-(--th-fg-heading)">
            How to Extract a YouTube Transcript
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Paste the YouTube URL",
                desc: "Copy any YouTube video URL and paste it into the input field above. We support youtube.com, youtu.be, embed links, and direct video IDs.",
              },
              {
                step: "2",
                title: "Click Get Transcript",
                desc: "Hit the 'Get Transcript' button or press Enter. The tool fetches captions directly from YouTube and displays them with timestamps in seconds.",
              },
              {
                step: "3",
                title: "Copy, Search, or Download",
                desc: "Copy the full transcript to your clipboard, search for specific words or phrases, toggle timestamps, or download everything as a .txt file.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-(--th-border) bg-(--th-card) p-6"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-sm font-bold text-rose-400">
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
                title: "Instant Transcript Extraction",
                desc: "Paste any YouTube URL and get the full video transcript in seconds. Works with auto-generated and manually added captions.",
              },
              {
                title: "Search Inside Transcript",
                desc: "Find specific words or phrases with real-time search filtering and highlighting. Perfect for locating key moments in long videos.",
              },
              {
                title: "Timestamps Toggle",
                desc: "View transcripts with or without timestamps. Timestamps help you navigate the video; hide them for cleaner text output.",
              },
              {
                title: "Copy & Download",
                desc: "Copy the entire transcript to your clipboard with one click, or download it as a .txt file for offline use and content repurposing.",
              },
              {
                title: "Word & Character Count",
                desc: "See instant word and character counts for the transcript — useful for content creators, students, and SEO professionals.",
              },
              {
                title: "All URL Formats Supported",
                desc: "Works with youtube.com/watch, youtu.be short links, embed URLs, Shorts, and direct 11-character video IDs.",
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

        {/* What are YouTube Transcripts? — long-form content for SEO */}
        <section className="mt-14 border-t border-(--th-border) pt-10">
          <h2 className="mb-4 text-xl font-bold text-(--th-fg-heading)">
            What Are YouTube Transcripts?
          </h2>
          <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-(--th-fg-muted)">
            <p>
              <strong className="text-(--th-fg-heading)">YouTube transcripts</strong> are
              text versions of the spoken content in a video. They can be
              auto-generated by YouTube&apos;s speech recognition technology or
              manually uploaded by the video creator. Transcripts make video
              content accessible to deaf and hard-of-hearing viewers, and they
              are invaluable for anyone who prefers reading over watching.
            </p>
            <p>
              Transcripts are widely used for{" "}
              <strong className="text-(--th-fg-heading)">content repurposing</strong> —
              turning video content into blog posts, social media captions,
              study notes, and SEO-optimized articles. Researchers, students,
              and journalists rely on transcripts to quickly scan and reference
              video content without re-watching entire videos.
            </p>
            <p>
              Our YouTube Transcript Generator extracts these captions
              programmatically, letting you search, copy, and download them in
              a clean format. Unlike browser extensions that require
              installation, this tool works instantly in any browser with no
              setup, no signup, and no data stored on our servers.
            </p>
          </div>
        </section>

        {/* Use cases */}
        <section className="mt-14 border-t border-(--th-border) pt-10">
          <h2 className="mb-6 text-xl font-bold text-(--th-fg-heading)">
            Popular Use Cases
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Content Creation",
                desc: "Turn YouTube videos into blog posts, social media threads, and newsletter content.",
              },
              {
                title: "Study & Research",
                desc: "Extract lecture transcripts for note-taking, citation, and exam preparation.",
              },
              {
                title: "SEO & Marketing",
                desc: "Repurpose video transcripts into keyword-rich articles that rank on Google.",
              },
              {
                title: "Accessibility",
                desc: "Make video content accessible by providing text alternatives for hearing-impaired users.",
              },
              {
                title: "Translation",
                desc: "Use transcripts as a base for translating video content into other languages.",
              },
              {
                title: "Meeting Notes",
                desc: "Extract transcripts from recorded meetings and presentations for easy review.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-(--th-border) bg-(--th-card) p-5"
              >
                <h3 className="mb-1.5 text-sm font-semibold text-(--th-fg-heading)">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-(--th-fg-muted)">
                  {item.desc}
                </p>
              </div>
            ))}
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
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-(--th-fg-heading) transition-colors duration-200 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-500">
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
