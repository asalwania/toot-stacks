/**
 * Single-pass JSON syntax highlighter.
 *
 * Produces an HTML string with <span class="json-*"> tokens that are styled
 * via CSS custom properties in globals.css.  Because we tokenize raw text in
 * one pass we never corrupt already-inserted HTML.
 *
 * Token classes: json-key, json-string, json-number, json-bool, json-null,
 *                json-bracket, json-punct
 */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function highlightJSON(text: string): string {
  if (!text) return "";

  const out: string[] = [];
  let i = 0;
  const len = text.length;

  function peekColon(from: number): boolean {
    let j = from;
    while (
      j < len &&
      (text[j] === " " ||
        text[j] === "\t" ||
        text[j] === "\n" ||
        text[j] === "\r")
    )
      j++;
    return text[j] === ":";
  }

  while (i < len) {
    const ch = text[i];

    // ---- String ----
    if (ch === '"') {
      let j = i + 1;
      while (j < len && text[j] !== '"') {
        if (text[j] === "\\") j++;
        j++;
      }
      j++; // past closing quote
      const raw = text.slice(i, j);
      const cls = peekColon(j) ? "json-key" : "json-string";
      out.push(`<span class="${cls}">${esc(raw)}</span>`);
      i = j;
      continue;
    }

    // ---- Number ----
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      let j = i;
      if (text[j] === "-") j++;
      while (j < len && text[j] >= "0" && text[j] <= "9") j++;
      if (j < len && text[j] === ".") {
        j++;
        while (j < len && text[j] >= "0" && text[j] <= "9") j++;
      }
      if (j < len && (text[j] === "e" || text[j] === "E")) {
        j++;
        if (j < len && (text[j] === "+" || text[j] === "-")) j++;
        while (j < len && text[j] >= "0" && text[j] <= "9") j++;
      }
      out.push(
        `<span class="json-number">${esc(text.slice(i, j))}</span>`
      );
      i = j;
      continue;
    }

    // ---- true / false / null ----
    if (text.startsWith("true", i)) {
      out.push('<span class="json-bool">true</span>');
      i += 4;
      continue;
    }
    if (text.startsWith("false", i)) {
      out.push('<span class="json-bool">false</span>');
      i += 5;
      continue;
    }
    if (text.startsWith("null", i)) {
      out.push('<span class="json-null">null</span>');
      i += 4;
      continue;
    }

    // ---- Brackets ----
    if (ch === "{" || ch === "}" || ch === "[" || ch === "]") {
      out.push(`<span class="json-bracket">${ch}</span>`);
      i++;
      continue;
    }

    // ---- Punctuation ----
    if (ch === ":") {
      out.push('<span class="json-punct">:</span>');
      i++;
      continue;
    }
    if (ch === ",") {
      out.push('<span class="json-punct">,</span>');
      i++;
      continue;
    }

    // ---- Whitespace & anything else ----
    out.push(esc(ch));
    i++;
  }

  return out.join("");
}
