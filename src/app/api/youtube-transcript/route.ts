import { NextRequest } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

/* ------------------------------------------------------------------ */
/*  Simple in-memory cache — avoids re-fetching for the same video    */
/* ------------------------------------------------------------------ */

interface CacheEntry {
  data: TranscriptSegment[];
  lang: string;
  ts: number;
}

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
  lang: string;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.ts > CACHE_TTL) cache.delete(key);
  }
}

/* ------------------------------------------------------------------ */
/*  Scrape available caption track languages from the watch page      */
/* ------------------------------------------------------------------ */

async function getAvailableLanguages(videoId: string): Promise<string[]> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "*",
      },
    });
    const html = await res.text();

    // Extract captionTracks from ytInitialPlayerResponse
    const match = html.match(/"captionTracks"\s*:\s*(\[.*?\])/);
    if (!match) return [];

    const tracks = JSON.parse(match[1]) as {
      languageCode: string;
      kind?: string;
      name?: { simpleText?: string };
    }[];

    // Return language codes, prioritising non-ASR (manually uploaded) tracks
    return tracks.map((t) => t.languageCode);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/youtube-transcript?videoId=<id>&lang=<code>              */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  const lang = request.nextUrl.searchParams.get("lang"); // e.g. "hi", "en", "es"

  if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
    return Response.json(
      { error: "Invalid or missing videoId. Expected an 11-character YouTube video ID." },
      { status: 400 }
    );
  }

  const cacheKey = `${videoId}:${lang ?? "_auto"}`;

  // Return cached result if available
  pruneCache();
  const cached = cache.get(cacheKey);
  if (cached) {
    return Response.json({
      transcript: cached.data,
      lang: cached.lang,
    });
  }

  try {
    // If no lang specified, detect available languages and pick the first
    // (which is typically the original audio language)
    let resolvedLang = lang ?? undefined;
    let availableLangs: string[] = [];

    if (!lang) {
      availableLangs = await getAvailableLanguages(videoId);
      // First track is usually the original language
      if (availableLangs.length > 0) {
        resolvedLang = availableLangs[0];
      }
    } else {
      // Still fetch available languages to return to the client
      availableLangs = await getAvailableLanguages(videoId);
    }

    const raw = await YoutubeTranscript.fetchTranscript(videoId, {
      ...(resolvedLang ? { lang: resolvedLang } : {}),
    });

    const detectedLang = raw[0]?.lang ?? resolvedLang ?? "en";

    const transcript: TranscriptSegment[] = raw.map((seg) => ({
      text: seg.text,
      offset: seg.offset,
      duration: seg.duration,
      lang: seg.lang ?? detectedLang,
    }));

    cache.set(cacheKey, { data: transcript, lang: detectedLang, ts: Date.now() });

    return Response.json({
      transcript,
      lang: detectedLang,
      availableLanguages: availableLangs,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch transcript";

    // Distinguish between "no captions" and other failures
    const isNoCaptions =
      message.toLowerCase().includes("disabled") ||
      message.toLowerCase().includes("no transcript") ||
      message.toLowerCase().includes("could not");

    const isLangUnavailable =
      message.toLowerCase().includes("no transcripts are available in");

    return Response.json(
      {
        error: isLangUnavailable
          ? `Transcript not available in the requested language. ${message}`
          : isNoCaptions
            ? "No captions available for this video. The video may not have subtitles or they may be disabled."
            : `Failed to fetch transcript: ${message}`,
      },
      { status: isNoCaptions || isLangUnavailable ? 404 : 500 }
    );
  }
}
