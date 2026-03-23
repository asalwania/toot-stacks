# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start dev server (Next.js 16, port 3000)
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- No test framework is configured

## Architecture

**WebToolkit (ToolsStack)** — a collection of free, client-side browser tools (JSON formatter, image compressor, PDF tools, regex tester, etc.). Next.js 16 App Router with React 19, Tailwind CSS v4, TypeScript.

### Key patterns

- **Tool registry**: All tools are defined in `src/lib/tools-registry.ts` — the `Tool` interface and `tools` array are the single source of truth for tool metadata (name, slug, category, keywords, colors). Adding a new tool starts here.
- **Tool pages**: Each tool lives at `src/app/tools/<slug>/page.tsx`. These are server components that handle SEO metadata (custom `generateMetadata`), JSON-LD structured data (WebApplication, FAQ, HowTo, Breadcrumb schemas), and render the tool inside `<ToolLayout>`. Some pages use `generateToolMetadata()` from `src/lib/seo.ts`; others hand-tune metadata for long-tail SEO.
- **Tool components**: Interactive client components live in `src/components/tools/<ToolName>.tsx`. All processing is client-side (no API routes).
- **Shared UI**: Reusable components in `src/components/ui/` (CodeEditor, CopyButton, FileDropZone, JsonTreeView, TabSwitcher, etc.).
- **Layout**: `src/components/layout/ToolLayout.tsx` wraps every tool page with breadcrumbs, header, ad slots, related tools, and SEO content sections.

### Styling

- Dark-mode-only theme using CSS custom properties (`--th-bg`, `--th-fg`, `--th-card`, etc.) defined in `src/styles/globals.css`
- Tailwind v4 with `@theme inline` block for custom color scales (primary=indigo, accent=violet, surface=dark), fonts (DM Sans / JetBrains Mono), and animations
- Tool colors mapped via `colorMap` in ToolLayout (each tool has a `color` field like "blue", "emerald", "cyan")

### Path alias

`@/*` maps to `./src/*` (configured in tsconfig.json)

### SEO

- Site constants (`SITE_URL`, `SITE_NAME`) in `src/lib/seo.ts`
- `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/manifest.ts` for crawlers
- Google AdSense integration in layout and `AdSlot` component

### Key libraries

- `pdf-lib` + `@pdf-lib/fontkit` — PDF manipulation
- `jszip` — ZIP file handling
- `qrcode` — QR code generation
- `file-saver` — client-side file downloads
