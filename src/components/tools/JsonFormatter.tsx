"use client";

import {
  useState,
  useCallback,
  useMemo,
  useRef,
  type KeyboardEvent,
} from "react";
import CopyButton from "@/components/ui/CopyButton";

/* ================================================================== */
/*  JSON Syntax Highlighter                                            */
/* ================================================================== */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightJSON(text: string): string {
  if (!text) return "";

  // Single-pass tokenizer — avoids regex-over-HTML corruption
  const out: string[] = [];
  let i = 0;
  const len = text.length;

  // Track whether the next string token is a key (followed by ':')
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
        if (text[j] === "\\") j++; // skip escaped char
        j++;
      }
      j++; // past closing quote
      const raw = text.slice(i, j);
      const isKey = peekColon(j);
      const cls = isKey ? "json-key" : "json-string";
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
      out.push(`<span class="json-number">${esc(text.slice(i, j))}</span>`);
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

    // ---- Brackets / braces ----
    if (ch === "{" || ch === "}" || ch === "[" || ch === "]") {
      out.push(`<span class="json-bracket">${ch}</span>`);
      i++;
      continue;
    }

    // ---- Colon ----
    if (ch === ":") {
      out.push('<span class="json-punct">:</span>');
      i++;
      continue;
    }

    // ---- Comma ----
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

/* ================================================================== */
/*  VS Code–style JSON Editor                                          */
/* ================================================================== */

function JsonEditor({
  value,
  onChange,
  placeholder,
  readOnly = false,
  errorLine,
  indentSize = 2,
  minHeight = 420,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  errorLine?: number | null;
  indentSize?: number;
  minHeight?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = value.split("\n");
  const lineCount = lines.length || 1;

  const highlighted = useMemo(() => highlightJSON(value), [value]);

  /* ---- Sync scroll between textarea, pre, and gutter ---- */
  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    const pre = preRef.current;
    const gut = gutterRef.current;
    if (!ta) return;
    if (pre) {
      pre.scrollTop = ta.scrollTop;
      pre.scrollLeft = ta.scrollLeft;
    }
    if (gut) {
      gut.scrollTop = ta.scrollTop;
    }
  }, []);

  /* ---- Smart keydown handler ---- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (readOnly || !onChange) return;

      const ta = e.currentTarget;
      const { selectionStart: start, selectionEnd: end, value: val } = ta;

      const PAIRS: Record<string, string> = {
        '"': '"',
        "{": "}",
        "[": "]",
      };

      /* ---- Tab → insert spaces ---- */
      if (e.key === "Tab") {
        e.preventDefault();
        const spaces = " ".repeat(indentSize);
        const next = val.slice(0, start) + spaces + val.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + indentSize;
        });
        return;
      }

      /* ---- Auto-close pairs: " { [ ---- */
      if (PAIRS[e.key] && start === end) {
        // For quotes: only auto-close if not already inside a string at an odd quote count
        if (e.key === '"') {
          // If next char is already a closing quote, just skip over it
          if (val[start] === '"') {
            e.preventDefault();
            requestAnimationFrame(() => {
              ta.selectionStart = ta.selectionEnd = start + 1;
            });
            return;
          }
        }

        e.preventDefault();
        const close = PAIRS[e.key];
        const next = val.slice(0, start) + e.key + close + val.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 1;
        });
        return;
      }

      /* ---- Skip over closing chars if already there ---- */
      if (
        (e.key === "}" || e.key === "]" || e.key === '"') &&
        val[start] === e.key &&
        start === end
      ) {
        e.preventDefault();
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 1;
        });
        return;
      }

      /* ---- Backspace: delete pair ---- */
      if (e.key === "Backspace" && start === end && start > 0) {
        const before = val[start - 1];
        const after = val[start];
        if (
          (before === '"' && after === '"') ||
          (before === "{" && after === "}") ||
          (before === "[" && after === "]")
        ) {
          e.preventDefault();
          const next = val.slice(0, start - 1) + val.slice(start + 1);
          onChange(next);
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start - 1;
          });
          return;
        }
      }

      /* ---- Enter: smart indent ---- */
      if (e.key === "Enter") {
        e.preventDefault();
        const before = val.slice(0, start);
        const after = val.slice(end);
        const currentLine = before.split("\n").pop() ?? "";
        const currentIndent = currentLine.match(/^(\s*)/)?.[1] ?? "";
        const charBefore = before.trimEnd().slice(-1);
        const charAfter = after.trimStart()[0];

        // After { or [ → increase indent
        if (charBefore === "{" || charBefore === "[") {
          const newIndent = currentIndent + " ".repeat(indentSize);
          // If next char is the closing bracket, put cursor between
          if (
            (charBefore === "{" && charAfter === "}") ||
            (charBefore === "[" && charAfter === "]")
          ) {
            const next =
              before + "\n" + newIndent + "\n" + currentIndent + after;
            onChange(next);
            const cursorPos = before.length + 1 + newIndent.length;
            requestAnimationFrame(() => {
              ta.selectionStart = ta.selectionEnd = cursorPos;
            });
          } else {
            const next = before + "\n" + newIndent + after;
            onChange(next);
            const cursorPos = before.length + 1 + newIndent.length;
            requestAnimationFrame(() => {
              ta.selectionStart = ta.selectionEnd = cursorPos;
            });
          }
        }
        // Before } or ] → decrease indent
        else if (charAfter === "}" || charAfter === "]") {
          const decreased =
            currentIndent.length >= indentSize
              ? currentIndent.slice(indentSize)
              : "";
          const next = before + "\n" + decreased + after;
          onChange(next);
          const cursorPos = before.length + 1 + decreased.length;
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = cursorPos;
          });
        }
        // Normal enter → keep indent
        else {
          // After a comma at end of line, keep same indent
          const next = before + "\n" + currentIndent + after;
          onChange(next);
          const cursorPos = before.length + 1 + currentIndent.length;
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = cursorPos;
          });
        }
      }
    },
    [readOnly, onChange, indentSize],
  );

  return (
    <div
      className="json-editor group relative flex overflow-hidden rounded-2xl border border-[var(--th-border)]"
      style={{ minHeight, backgroundColor: 'var(--th-editor-bg)' }}
    >
      {/* ---- Line gutter ---- */}
      <div
        ref={gutterRef}
        className="pointer-events-none select-none overflow-hidden border-r border-[var(--th-border)] py-3 font-mono text-[13px] leading-5"
        style={{ minWidth: lineCount > 999 ? 56 : lineCount > 99 ? 48 : 40, backgroundColor: 'var(--th-editor-gutter)' }}
        aria-hidden="true"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div
            key={i}
            className={`pr-3 text-right ${
              errorLine === i + 1
                ? "bg-red-500/15 text-red-400"
                : ""
            }`}
            style={errorLine === i + 1 ? undefined : { color: 'var(--th-editor-line)' }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* ---- Editor area (pre + textarea stacked) ---- */}
      <div className="relative flex-1">
        {/* Syntax-highlighted layer */}
        <pre
          ref={preRef}
          className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre p-3 font-mono text-[13px] leading-5"
          aria-hidden="true"
          dangerouslySetInnerHTML={{
            __html:
              highlighted ||
              `<span style="color:var(--th-fg-faint)">${placeholder ?? ""}</span>`,
          }}
        />

        {/* Transparent textarea on top */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="relative z-10 h-full w-full resize-none bg-transparent p-3 font-mono text-[13px] leading-5 text-transparent outline-none selection:bg-primary-500/30 selection:text-transparent"
          style={{ minHeight, caretColor: 'var(--th-editor-caret)' }}
          placeholder={!value ? placeholder : undefined}
        />
      </div>

      {/* ---- Minimap-style scroll indicator ---- */}
      {lineCount > 30 && (
        <div
          className="absolute bottom-2 right-2 z-20 rounded px-1.5 py-0.5 font-mono text-[10px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ backgroundColor: 'var(--th-pill-bg)', color: 'var(--th-fg-faint)' }}
        >
          {lineCount} lines
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Tree Node                                                          */
/* ================================================================== */

function TreeNode({
  label,
  value,
  depth,
  defaultOpen = true,
}: {
  label: string;
  value: unknown;
  depth: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen && depth < 3);
  const isObj = value !== null && typeof value === "object";
  const isArr = Array.isArray(value);
  const entries = isObj
    ? isArr
      ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
      : Object.entries(value as Record<string, unknown>)
    : [];

  if (!isObj) {
    const color =
      typeof value === "string"
        ? "text-[var(--th-syn-string)]"
        : typeof value === "number"
          ? "text-[var(--th-syn-number)]"
          : typeof value === "boolean"
            ? "text-[var(--th-syn-bool)]"
            : "text-[var(--th-syn-bool)]";
    const display = typeof value === "string" ? `"${value}"` : String(value);

    return (
      <div className="flex gap-1 py-px" style={{ paddingLeft: depth * 18 }}>
        {label && <span className="text-[var(--th-syn-key)]">{label}:&nbsp;</span>}
        <span className={color}>{display}</span>
      </div>
    );
  }

  const bracket = isArr ? ["[", "]"] : ["{", "}"];

  return (
    <div style={{ paddingLeft: depth * 18 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="-ml-1 flex w-full items-center gap-1 rounded px-1 py-px text-left transition-colors duration-150 hover:bg-[var(--th-btn-ghost-hover)] cursor-pointer"
      >
        <span
          className="inline-block w-3.5 text-center text-[10px] text-[var(--th-fg-faint)] transition-transform duration-150"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </span>
        {label && <span className="text-[var(--th-syn-key)]">{label}:</span>}
        <span className="text-[var(--th-syn-bracket)]">
          {bracket[0]}
          {!open && (
            <span className="text-[var(--th-fg-faint)]">
              {" "}
              {entries.length} {entries.length === 1 ? "item" : "items"}{" "}
            </span>
          )}
          {!open && bracket[1]}
        </span>
      </button>
      {open && (
        <>
          {entries.map(([k, v]) => (
            <TreeNode
              key={k}
              label={isArr ? `${k}` : k}
              value={v}
              depth={depth + 1}
              defaultOpen={depth < 2}
            />
          ))}
          <div className="py-px text-[var(--th-syn-bracket)]" style={{ paddingLeft: 18 }}>
            {bracket[1]}
          </div>
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Parse helper                                                       */
/* ================================================================== */

type ParseResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; line?: number; column?: number };

function parseJSON(text: string): ParseResult {
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
      const splitLines = before.split("\n");
      line = splitLines.length;
      column = splitLines[splitLines.length - 1].length + 1;
    }
    return { ok: false, error: msg, line, column };
  }
}

/* ================================================================== */
/*  Stats bar                                                          */
/* ================================================================== */

function StatsBar({ input, output }: { input: string; output: string }) {
  const inputLines = input ? input.split("\n").length : 0;
  const inputSize = new Blob([input]).size;
  const outputSize = output ? new Blob([output]).size : 0;
  const savings =
    inputSize > 0 && outputSize > 0
      ? Math.round(((inputSize - outputSize) / inputSize) * 100)
      : null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--th-fg-faint)]">
      <span>{inputLines} lines</span>
      <span>{fmtSize(inputSize)}</span>
      {output && <span>&rarr; {fmtSize(outputSize)}</span>}
      {savings !== null && savings !== 0 && (
        <span className={savings > 0 ? "text-emerald-500" : "text-amber-500"}>
          {savings > 0 ? `${savings}% smaller` : `${Math.abs(savings)}% larger`}
        </span>
      )}
    </div>
  );
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

type Mode = "format" | "validate" | "tree";

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [manualOutput, setManualOutput] = useState("");
  const [manualError, setManualError] = useState<{
    message: string;
    line?: number;
    column?: number;
  } | null>(null);
  const [mode, setMode] = useState<Mode>("format");
  const [indent, setIndent] = useState<2 | 4>(2);
  const [autoFormat, setAutoFormat] = useState(true);

  /* ---- derived auto-format result ---- */
  const auto = useMemo(() => {
    if (!autoFormat || !input.trim()) return { output: "", error: null };
    const result = parseJSON(input);
    if (result.ok) {
      return {
        output:
          mode === "format"
            ? JSON.stringify(result.data, null, indent)
            : JSON.stringify(result.data),
        error: null,
      };
    }
    return {
      output: "",
      error: {
        message: result.error,
        line: result.line,
        column: result.column,
      },
    };
  }, [input, indent, autoFormat, mode]);

  const output = autoFormat && input.trim() ? auto.output : manualOutput;
  const error = autoFormat && input.trim() ? auto.error : manualError;

  /* ---- actions ---- */
  const handleFormat = useCallback(() => {
    if (!input.trim()) return;
    const result = parseJSON(input);
    if (result.ok) {
      setManualOutput(JSON.stringify(result.data, null, indent));
      setManualError(null);
    } else {
      setManualError({
        message: result.error,
        line: result.line,
        column: result.column,
      });
    }
  }, [input, indent]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) return;
    const result = parseJSON(input);
    if (result.ok) {
      setManualOutput(JSON.stringify(result.data));
      setManualError(null);
    } else {
      setManualError({
        message: result.error,
        line: result.line,
        column: result.column,
      });
    }
  }, [input]);

  const handleClear = useCallback(() => {
    setInput("");
    setManualOutput("");
    setManualError(null);
  }, []);

  /* ---- tree data ---- */
  const treeData = useMemo(() => {
    if (!input.trim()) return undefined;
    try {
      return JSON.parse(input);
    } catch {
      return undefined;
    }
  }, [input]);

  /* ---- validation result ---- */
  const validation = useMemo(() => {
    if (!input.trim()) return null;
    const result = parseJSON(input);
    if (result.ok) {
      const type = Array.isArray(result.data)
        ? "array"
        : typeof result.data === "object" && result.data !== null
          ? "object"
          : typeof result.data;
      const detail =
        type === "array"
          ? `${(result.data as unknown[]).length} items`
          : type === "object"
            ? `${Object.keys(result.data as object).length} keys`
            : "";
      return { valid: true as const, type, detail };
    }
    return {
      valid: false as const,
      error: result.error,
      line: result.line,
      column: result.column,
    };
  }, [input]);

  return (
    <div className="space-y-4">
      {/* ---- Top toolbar ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Mode tabs */}
        <div className="inline-flex rounded-xl border border-[var(--th-border-hover)] bg-[var(--th-pill-bg)] p-1">
          {(
            [
              ["format", "Format"],
              ["validate", "Validate"],
              ["tree", "Tree View"],
            ] as [Mode, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`rounded-lg px-4 py-2 cursor-pointer text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                mode === id
                  ? "bg-[var(--th-btn-ghost-hover)] text-[var(--th-fg-heading)]"
                  : "text-[var(--th-fg-faint)] hover:text-[var(--th-fg-muted)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {mode === "format" && (
            <>
              <div className="flex items-center rounded-lg border border-[var(--th-border-hover)] bg-[var(--th-pill-bg)]">
                <span className="px-2.5 text-xs text-[var(--th-fg-faint)]">Indent</span>
                {([2, 4] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setIndent(n)}
                    className={`px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 cursor-pointer ${
                      indent === n
                        ? "bg-primary-500/20 text-primary-400"
                        : "text-[var(--th-fg-faint)] hover:text-[var(--th-fg-heading)]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                onClick={handleFormat}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer"
              >
                Format
              </button>
              <button
                onClick={handleMinify}
                className="rounded-lg border border-[var(--th-border-hover)] bg-[var(--th-pill-bg)] px-3 py-1.5 text-xs font-medium text-[var(--th-fg-muted)] transition-colors duration-200 hover:bg-[var(--th-btn-ghost-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer"
              >
                Minify
              </button>
            </>
          )}

          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--th-fg-faint)]">
            <input
              type="checkbox"
              checked={autoFormat}
              onChange={(e) => setAutoFormat(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-primary-500"
            />
            Auto
          </label>

          <div className="h-4 w-px bg-[var(--th-border-hover)]" />

          <button
            onClick={handleClear}
            className="text-xs text-[var(--th-fg-faint)] transition-colors duration-200 hover:text-red-400 cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ---- Error bar ---- */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0"
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
            <span className="font-medium">Syntax Error: </span>
            {error.message}
            {error.line != null && (
              <span className="ml-1.5 text-red-500/70">
                (line {error.line}
                {error.column != null && `, col ${error.column}`})
              </span>
            )}
          </div>
        </div>
      )}

      {/* ---- Validate banner ---- */}
      {mode === "validate" && validation && (
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            validation.valid
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          <span className="text-lg">{validation.valid ? "✓" : "✕"}</span>
          <div>
            {validation.valid ? (
              <span>
                <span className="font-medium">Valid JSON</span> —{" "}
                {validation.type}
                {validation.detail && `, ${validation.detail}`}
              </span>
            ) : (
              <span>
                <span className="font-medium">Invalid JSON</span> —{" "}
                {validation.error}
                {validation.line != null && (
                  <span className="ml-1 opacity-70">
                    (line {validation.line}
                    {validation.column != null && `, col ${validation.column}`})
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ---- Split panels ---- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: Input */}
        <div className="flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--th-fg-faint)]">
              Input
            </span>
            <StatsBar input={input} output="" />
          </div>
          <JsonEditor
            value={input}
            onChange={setInput}
            placeholder={'{\n  "key": "value"\n}'}
            errorLine={error?.line ?? null}
            indentSize={indent}
          />
        </div>

        {/* Right: Output / Tree */}
        <div className="flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--th-fg-faint)]">
              {mode === "tree" ? "Tree View" : "Output"}
            </span>
            {output && mode !== "tree" && (
              <CopyButton text={output} label="Copy" />
            )}
          </div>

          {mode === "tree" ? (
            <div
              className="flex-1 overflow-auto rounded-2xl border border-[var(--th-border)] p-4 font-mono text-[13px] leading-5"
              style={{ minHeight: 420, backgroundColor: 'var(--th-editor-bg)' }}
            >
              {!input.trim() && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-[var(--th-fg-faint)]">
                    Enter JSON on the left to explore the tree.
                  </p>
                </div>
              )}
              {input.trim() && !treeData && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-red-400/70">
                    Fix JSON errors to view the tree.
                  </p>
                </div>
              )}
              {treeData !== undefined && (
                <TreeNode label="" value={treeData} depth={0} defaultOpen />
              )}
            </div>
          ) : (
            <>
              {output ? (
                <JsonEditor value={output} readOnly indentSize={indent} />
              ) : (
                <div
                  className="flex flex-1 items-center justify-center rounded-2xl border border-[var(--th-border)] p-6"
                  style={{ minHeight: 420, backgroundColor: 'var(--th-editor-bg)' }}
                >
                  <div className="text-center">
                    <div
                      className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl font-mono text-lg text-[var(--th-fg-faint)]"
                      style={{ backgroundColor: 'var(--th-pill-bg)' }}
                    >
                      {"{ }"}
                    </div>
                    <p className="text-sm text-[var(--th-fg-faint)]">
                      {input.trim()
                        ? "Click Format or enable Auto to see output"
                        : "Formatted output will appear here"}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {output && mode !== "tree" && (
            <div className="mt-2">
              <StatsBar input={input} output={output} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { JsonFormatter };
