"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { CopyButton } from "@/components/ui/CopyButton";
import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
  lang: string;
}

/* ------------------------------------------------------------------ */
/*  Language display names                                             */
/* ------------------------------------------------------------------ */

const LANG_NAMES: Record<string, string> = {
  af: "Afrikaans", am: "Amharic", ar: "Arabic", az: "Azerbaijani",
  be: "Belarusian", bg: "Bulgarian", bn: "Bengali", bs: "Bosnian",
  ca: "Catalan", ceb: "Cebuano", co: "Corsican", cs: "Czech",
  cy: "Welsh", da: "Danish", de: "German", el: "Greek",
  en: "English", eo: "Esperanto", es: "Spanish", et: "Estonian",
  eu: "Basque", fa: "Persian", fi: "Finnish", fil: "Filipino",
  fr: "French", fy: "Frisian", ga: "Irish", gd: "Scottish Gaelic",
  gl: "Galician", gu: "Gujarati", ha: "Hausa", haw: "Hawaiian",
  he: "Hebrew", hi: "Hindi", hmn: "Hmong", hr: "Croatian",
  ht: "Haitian Creole", hu: "Hungarian", hy: "Armenian", id: "Indonesian",
  ig: "Igbo", is: "Icelandic", it: "Italian", iw: "Hebrew",
  ja: "Japanese", jv: "Javanese", ka: "Georgian", kk: "Kazakh",
  km: "Khmer", kn: "Kannada", ko: "Korean", ku: "Kurdish",
  ky: "Kyrgyz", la: "Latin", lb: "Luxembourgish", lo: "Lao",
  lt: "Lithuanian", lv: "Latvian", mg: "Malagasy", mi: "Maori",
  mk: "Macedonian", ml: "Malayalam", mn: "Mongolian", mr: "Marathi",
  ms: "Malay", mt: "Maltese", my: "Myanmar", ne: "Nepali",
  nl: "Dutch", no: "Norwegian", ny: "Chichewa", or: "Odia",
  pa: "Punjabi", pl: "Polish", ps: "Pashto", pt: "Portuguese",
  ro: "Romanian", ru: "Russian", rw: "Kinyarwanda", sd: "Sindhi",
  si: "Sinhala", sk: "Slovak", sl: "Slovenian", sm: "Samoan",
  sn: "Shona", so: "Somali", sq: "Albanian", sr: "Serbian",
  st: "Sesotho", su: "Sundanese", sv: "Swedish", sw: "Swahili",
  ta: "Tamil", te: "Telugu", tg: "Tajik", th: "Thai",
  tk: "Turkmen", tl: "Tagalog", tr: "Turkish", tt: "Tatar",
  ug: "Uyghur", uk: "Ukrainian", ur: "Urdu", uz: "Uzbek",
  vi: "Vietnamese", xh: "Xhosa", yi: "Yiddish", yo: "Yoruba",
  zh: "Chinese", "zh-Hans": "Chinese (Simplified)", "zh-Hant": "Chinese (Traditional)",
  zu: "Zulu",
};

function getLangName(code: string): string {
  return LANG_NAMES[code] ?? code.toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();

  // Direct 11-char video ID
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);

    // youtube.com/watch?v=
    if (
      (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") &&
      url.pathname === "/watch"
    ) {
      return url.searchParams.get("v") || null;
    }

    // youtu.be/<id>
    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1) || null;
    }

    // youtube.com/embed/<id>
    if (
      (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") &&
      url.pathname.startsWith("/embed/")
    ) {
      return url.pathname.split("/")[2] || null;
    }

    // youtube.com/shorts/<id>
    if (
      (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") &&
      url.pathname.startsWith("/shorts/")
    ) {
      return url.pathname.split("/")[2] || null;
    }

    // youtube.com/v/<id>
    if (
      (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") &&
      url.pathname.startsWith("/v/")
    ) {
      return url.pathname.split("/")[2] || null;
    }
  } catch {
    // Not a URL — already checked for raw ID above
  }

  // Fallback regex for loose patterns
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function YouTubeTranscript() {
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  // Debounce & dedup
  const lastFetchedKey = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- Fetch transcript ---- */
  const fetchTranscript = useCallback(
    async (langOverride?: string) => {
      const videoId = extractVideoId(url);
      if (!videoId) {
        setError(
          "Invalid YouTube URL. Please enter a valid youtube.com or youtu.be link."
        );
        return;
      }

      const lang = langOverride ?? selectedLang;
      const fetchKey = `${videoId}:${lang ?? "_auto"}`;

      // Prevent duplicate fetches
      if (fetchKey === lastFetchedKey.current && transcript.length > 0) return;

      setLoading(true);
      setError(null);
      setTranscript([]);
      setVideoTitle(null);

      try {
        const params = new URLSearchParams({ videoId });
        if (lang) params.set("lang", lang);

        const res = await fetch(`/api/youtube-transcript?${params}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to fetch transcript.");
          return;
        }

        setTranscript(data.transcript);
        lastFetchedKey.current = fetchKey;
        setVideoTitle(videoId);

        if (data.lang) setDetectedLang(data.lang);
        if (data.availableLanguages?.length) {
          setAvailableLanguages(data.availableLanguages);
        }
        // Set selectedLang to the actual language we got back
        if (data.lang && !lang) {
          setSelectedLang(data.lang);
        }
      } catch {
        setError("Network error. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [url, transcript.length, selectedLang]
  );

  const handleSubmit = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchTranscript(), 300);
  }, [fetchTranscript]);

  /* ---- Switch language ---- */
  const handleLanguageChange = useCallback(
    (lang: string) => {
      setSelectedLang(lang);
      lastFetchedKey.current = null; // force re-fetch
      fetchTranscript(lang);
    },
    [fetchTranscript]
  );

  /* ---- Filtered transcript ---- */
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return transcript;
    const q = searchQuery.toLowerCase();
    return transcript.filter((seg) => seg.text.toLowerCase().includes(q));
  }, [transcript, searchQuery]);

  /* ---- Plain text output ---- */
  const plainText = useMemo(() => {
    return filtered
      .map((seg) =>
        showTimestamps
          ? `[${formatTimestamp(seg.offset)}] ${seg.text}`
          : seg.text
      )
      .join("\n");
  }, [filtered, showTimestamps]);

  /* ---- Stats ---- */
  const wordCount = useMemo(() => {
    const text = transcript.map((s) => s.text).join(" ");
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [transcript]);

  const charCount = useMemo(() => {
    return transcript.map((s) => s.text).join(" ").length;
  }, [transcript]);

  /* ---- Download ---- */
  const handleDownload = useCallback(() => {
    const blob = new Blob([plainText], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `transcript-${videoTitle || "youtube"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }, [plainText, videoTitle]);

  /* ---- Thumbnail ---- */
  const videoId = extractVideoId(url);

  return (
    <div className="space-y-6">
      {/* ---- Input Section ---- */}
      <div className="rounded-2xl border border-(--th-border) bg-(--th-card) p-5 sm:p-6">
        <label
          htmlFor="yt-url"
          className="mb-2 block text-sm font-medium text-(--th-fg-heading)"
        >
          YouTube Video URL
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="yt-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            className="flex-1 rounded-xl border border-(--th-border) bg-(--th-editor-bg) px-4 py-2.5 text-sm text-(--th-fg) placeholder:text-(--th-fg-faint) focus:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            className="!bg-rose-600 !shadow-rose-600/20 hover:!bg-rose-500 active:!bg-rose-700 focus-visible:!ring-rose-500"
          >
            Get Transcript
          </Button>
        </div>

        {/* Video preview thumbnail */}
        {videoId && !loading && !error && transcript.length === 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-(--th-border) bg-(--th-surface) p-3">
            <img
              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
              alt="Video thumbnail"
              className="h-16 w-28 rounded-lg object-cover"
            />
            <div className="text-sm text-(--th-fg-muted)">
              Video ID: <span className="font-mono text-(--th-fg)">{videoId}</span>
            </div>
          </div>
        )}
      </div>

      {/* ---- Error State ---- */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-400">Error</p>
              <p className="mt-1 text-sm text-red-300/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ---- Loading State ---- */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-(--th-border) bg-(--th-card) py-16">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-rose-500/20 border-t-rose-500" />
          <p className="text-sm text-(--th-fg-muted)">Fetching transcript...</p>
        </div>
      )}

      {/* ---- Results Section ---- */}
      {transcript.length > 0 && (
        <>
          {/* Controls */}
          <div className="rounded-2xl border border-(--th-border) bg-(--th-card) p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Stats */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-(--th-fg-faint)">
                {detectedLang && (
                  <span className="rounded-lg bg-rose-500/10 px-2.5 py-1 font-medium text-rose-400">
                    {getLangName(detectedLang)}
                  </span>
                )}
                <span className="rounded-lg bg-(--th-surface) px-2.5 py-1 font-medium">
                  {transcript.length} segments
                </span>
                <span className="rounded-lg bg-(--th-surface) px-2.5 py-1 font-medium">
                  {wordCount.toLocaleString()} words
                </span>
                <span className="rounded-lg bg-(--th-surface) px-2.5 py-1 font-medium">
                  {charCount.toLocaleString()} characters
                </span>
                {searchQuery && (
                  <span className="rounded-lg bg-rose-500/10 px-2.5 py-1 font-medium text-rose-400">
                    {filtered.length} matches
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Language selector */}
                {availableLanguages.length > 1 && (
                  <select
                    value={selectedLang ?? ""}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-gray-300 transition-all duration-200 hover:bg-white/10 focus:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    {availableLanguages.map((code) => (
                      <option
                        key={code}
                        value={code}
                        className="bg-surface-900 text-gray-200"
                      >
                        {getLangName(code)}
                      </option>
                    ))}
                  </select>
                )}

                {/* Timestamps toggle */}
                <button
                  onClick={() => setShowTimestamps(!showTimestamps)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    showTimestamps
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                      : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Timestamps
                </button>

                <CopyButton text={plainText} label="Copy" />

                {/* Download button */}
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-gray-300 transition-all duration-200 hover:bg-white/10 hover:text-white"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                  Download .txt
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mt-4">
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--th-fg-faint)"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search inside transcript..."
                  className="w-full rounded-xl border border-(--th-border) bg-(--th-editor-bg) py-2.5 pl-10 pr-4 text-sm text-(--th-fg) placeholder:text-(--th-fg-faint) focus:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>
          </div>

          {/* Transcript Display */}
          <div className="rounded-2xl border border-(--th-border) bg-(--th-card) p-1">
            <div className="max-h-[600px] overflow-y-auto rounded-xl bg-(--th-editor-bg) p-4 sm:p-5">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-(--th-fg-faint)">
                  No matches found for &ldquo;{searchQuery}&rdquo;
                </p>
              ) : (
                <div className="space-y-1">
                  {filtered.map((seg, i) => (
                    <div
                      key={i}
                      className="group flex gap-3 rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-white/5"
                    >
                      {showTimestamps && (
                        <span className="shrink-0 pt-0.5 font-mono text-xs text-rose-400/70">
                          {formatTimestamp(seg.offset)}
                        </span>
                      )}
                      <span className="text-sm leading-relaxed text-(--th-fg-muted)">
                        {searchQuery ? (
                          <HighlightText
                            text={seg.text}
                            query={searchQuery}
                          />
                        ) : (
                          seg.text
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Summarize Placeholder */}
          <div className="rounded-2xl border border-dashed border-(--th-border) bg-(--th-surface) p-5 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
              <svg
                className="h-5 w-5 text-rose-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-(--th-fg-heading)">
              AI Summary
            </p>
            <p className="mt-1 text-xs text-(--th-fg-faint)">
              Coming soon — Get an AI-powered summary of any video transcript
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Search highlight helper                                            */
/* ------------------------------------------------------------------ */

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="rounded bg-rose-500/25 px-0.5 text-rose-300"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
