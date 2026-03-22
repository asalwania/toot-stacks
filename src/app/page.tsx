import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import HomeContent from "@/components/HomeContent";

export const metadata: Metadata = {
  title:
    "DevToolkit — Free Online Developer Tools | JSON, PDF, Image, Regex & More",
  description:
    "10 free developer tools that run in your browser. JSON formatter, image compressor, PDF merger, regex tester, password generator & more. No signup needed.",
  openGraph: {
    title:
      "DevToolkit — Free Online Developer Tools | JSON, PDF, Image, Regex & More",
    description:
      "10 free developer tools that run in your browser. JSON formatter, image compressor, PDF merger, regex tester, password generator & more. No signup needed.",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/og-home.png`,
        width: 1200,
        height: 630,
        alt: "DevToolkit — Free Online Developer Tools",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevToolkit — Free Online Developer Tools",
    description:
      "10 free developer tools that run in your browser. No signup needed.",
    images: [`${SITE_URL}/og-home.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const faqItems = [
  {
    question: "Are these developer tools really free?",
    answer:
      "Yes, every tool on DevToolkit is completely free with no hidden fees, premium tiers, or usage limits. We believe essential developer utilities should be accessible to everyone, whether you're a hobbyist or a professional engineer.",
  },
  {
    question: "Is my data safe when using DevToolkit?",
    answer:
      "Absolutely. All processing happens locally in your browser using client-side JavaScript and Web APIs. Your files, text, and data never leave your device — nothing is uploaded to any server. There are no analytics trackers or third-party data collection scripts.",
  },
  {
    question: "Do I need to create an account to use the tools?",
    answer:
      "No signup or account is required. Simply open any tool and start using it immediately. There are no login walls, email gates, or mandatory registrations of any kind.",
  },
  {
    question: "Can I use these tools on mobile devices?",
    answer:
      "Yes, DevToolkit is fully responsive and works on smartphones and tablets. Every tool has been optimized for touch input and smaller screens, so you can format JSON, generate passwords, or compress images right from your phone.",
  },
  {
    question: "What technologies power these tools?",
    answer:
      "DevToolkit is built with Next.js 15 and TypeScript for a fast, reliable experience. Individual tools leverage modern Web APIs like the Canvas API for image processing, the Web Crypto API for password generation, and libraries like pdf-lib for PDF manipulation — all running entirely in your browser.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HomeContent faqItems={faqItems} />
    </>
  );
}
