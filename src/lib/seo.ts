import type { Metadata } from 'next';
import type { Tool } from './tools-registry';

export const SITE_URL = 'https://devtoolkit.dev';
export const SITE_NAME = 'DevToolkit';
export const SITE_DESCRIPTION =
  'A collection of fast, free, and privacy-friendly developer tools that run entirely in your browser. Format JSON, compress images, generate passwords, build regex, and more — no sign-up required.';

export function generateToolMetadata(tool: Tool): Metadata {
  const title = `${tool.name} — Free Online Tool | ${SITE_NAME}`;
  const description = tool.longDescription;
  const url = `${SITE_URL}/tools/${tool.slug}`;

  return {
    title,
    description,
    keywords: tool.keywords,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: `${SITE_URL}/og/${tool.slug}.png`,
          width: 1200,
          height: 630,
          alt: `${tool.name} — ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og/${tool.slug}.png`],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  };
}
