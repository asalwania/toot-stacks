/**
 * Shared JSON parsing utilities.
 */

export type ParseOk = { ok: true; data: unknown };
export type ParseErr = {
  ok: false;
  error: string;
  line?: number;
  column?: number;
};
export type ParseResult = ParseOk | ParseErr;

/**
 * Parse a JSON string and return a discriminated union with optional
 * line/column info on failure.
 */
export function parseJSON(text: string): ParseResult {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch (e) {
    const msg = (e as Error).message;
    const posMatch = msg.match(/position\s+(\d+)/i);
    let line: number | undefined;
    let column: number | undefined;
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const before = text.slice(0, pos);
      const lines = before.split("\n");
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }
    return { ok: false, error: msg, line, column };
  }
}

/**
 * Cross-environment byte length (works in Node SSR and browser).
 */
export function byteLength(str: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(str).length;
  }
  return str.length;
}

/**
 * Human-readable file size string.
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Describe the shape of parsed JSON for validation summaries.
 */
export function describeJSON(data: unknown): { type: string; detail: string } {
  if (Array.isArray(data)) {
    return { type: "array", detail: `${data.length} items` };
  }
  if (typeof data === "object" && data !== null) {
    return {
      type: "object",
      detail: `${Object.keys(data as object).length} keys`,
    };
  }
  return { type: typeof data, detail: "" };
}
