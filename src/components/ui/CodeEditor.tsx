"use client";

import {
  useCallback,
  useMemo,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

export interface CodeEditorProps {
  /** Current text value. */
  value: string;
  /** Called on every keystroke. Omit for read-only. */
  onChange?: (v: string) => void;
  /** Placeholder shown when value is empty. */
  placeholder?: string;
  /** If true the textarea is non-editable. */
  readOnly?: boolean;
  /** Line number to highlight as an error (1-indexed). */
  errorLine?: number | null;
  /** Spaces per indent level (used for Tab / Enter). Default 2. */
  indentSize?: number;
  /** Minimum editor height in px. Default 420. */
  minHeight?: number;
  /** Maximum editor height as a Tailwind class. Default "max-h-105". */
  maxHeightClass?: string;
  /**
   * Highlight function: receives raw text, returns an HTML string.
   * Token styling is done via CSS classes (e.g. `.json-key`).
   */
  highlight?: (text: string) => string;
  /**
   * Character pairs that auto-close.  Default: `"` → `"`, `{` → `}`, `[` → `]`.
   */
  autoPairs?: Record<string, string>;
  /** Extra content rendered inside the editor (e.g. line-count badge). */
  children?: ReactNode;
}

/* ================================================================== */
/*  Default auto-close pairs                                           */
/* ================================================================== */

const DEFAULT_PAIRS: Record<string, string> = {
  '"': '"',
  "{": "}",
  "[": "]",
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export default function CodeEditor({
  value,
  onChange,
  placeholder,
  readOnly = false,
  errorLine,
  indentSize = 2,
  minHeight = 420,
  maxHeightClass = "max-h-105",
  highlight,
  autoPairs = DEFAULT_PAIRS,
  children,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lineCount = (value.match(/\n/g) || []).length + 1;
  const highlighted = useMemo(
    () => (highlight ? highlight(value) : ""),
    [value, highlight]
  );

  /* ---- Scroll sync ---- */
  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop;
    }
  }, []);

  /* ---- Smart keydown ---- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (readOnly || !onChange) return;

      const ta = e.currentTarget;
      const { selectionStart: start, selectionEnd: end, value: val } = ta;

      const setCursor = (pos: number) =>
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = pos;
        });

      /* Tab → insert spaces */
      if (e.key === "Tab") {
        e.preventDefault();
        const spaces = " ".repeat(indentSize);
        onChange(val.slice(0, start) + spaces + val.slice(end));
        setCursor(start + indentSize);
        return;
      }

      /* Auto-close pairs */
      if (autoPairs[e.key] && start === end) {
        if (e.key === '"' && val[start] === '"') {
          e.preventDefault();
          setCursor(start + 1);
          return;
        }
        e.preventDefault();
        const close = autoPairs[e.key];
        onChange(val.slice(0, start) + e.key + close + val.slice(end));
        setCursor(start + 1);
        return;
      }

      /* Skip over closing char */
      if (
        (e.key === "}" || e.key === "]" || e.key === '"') &&
        val[start] === e.key &&
        start === end
      ) {
        e.preventDefault();
        setCursor(start + 1);
        return;
      }

      /* Backspace: delete pair */
      if (e.key === "Backspace" && start === end && start > 0) {
        const before = val[start - 1];
        const after = val[start];
        const pairClose = autoPairs[before];
        if (pairClose && after === pairClose) {
          e.preventDefault();
          onChange(val.slice(0, start - 1) + val.slice(start + 1));
          setCursor(start - 1);
          return;
        }
      }

      /* Enter: smart indent */
      if (e.key === "Enter") {
        e.preventDefault();
        const before = val.slice(0, start);
        const after = val.slice(end);
        const currentLine = before.split("\n").pop() ?? "";
        const currentIndent = currentLine.match(/^(\s*)/)?.[1] ?? "";
        const charBefore = before.trimEnd().slice(-1);
        const charAfter = after.trimStart()[0];

        const openBrackets = Object.keys(autoPairs);
        const closeBrackets = Object.values(autoPairs);

        if (openBrackets.includes(charBefore) && charBefore !== '"') {
          const newIndent = currentIndent + " ".repeat(indentSize);
          const matchingClose = autoPairs[charBefore];
          if (matchingClose && charAfter === matchingClose) {
            const next =
              before + "\n" + newIndent + "\n" + currentIndent + after;
            onChange(next);
            setCursor(before.length + 1 + newIndent.length);
          } else {
            const next = before + "\n" + newIndent + after;
            onChange(next);
            setCursor(before.length + 1 + newIndent.length);
          }
        } else if (
          closeBrackets.includes(charAfter) &&
          charAfter !== '"'
        ) {
          const decreased =
            currentIndent.length >= indentSize
              ? currentIndent.slice(indentSize)
              : "";
          const next = before + "\n" + decreased + after;
          onChange(next);
          setCursor(before.length + 1 + decreased.length);
        } else {
          const next = before + "\n" + currentIndent + after;
          onChange(next);
          setCursor(before.length + 1 + currentIndent.length);
        }
      }
    },
    [readOnly, onChange, indentSize, autoPairs]
  );

  return (
    <div
      className={`code-editor group relative flex overflow-hidden rounded-2xl border border-(--th-border) ${maxHeightClass}`}
      style={{ minHeight, backgroundColor: "var(--th-editor-bg)" }}
    >
      {/* ---- Line gutter ---- */}
      <div
        ref={gutterRef}
        className="pointer-events-none select-none overflow-hidden border-r border-(--th-border) py-3 font-mono text-[13px] leading-5"
        style={{
          minWidth: lineCount > 999 ? 56 : lineCount > 99 ? 48 : 40,
          backgroundColor: "var(--th-editor-gutter)",
        }}
        aria-hidden="true"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div
            key={i}
            className={`pr-3 text-right ${
              errorLine === i + 1 ? "bg-red-500/15 text-red-400" : ""
            }`}
            style={
              errorLine === i + 1
                ? undefined
                : { color: "var(--th-editor-line)" }
            }
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* ---- Editor area ---- */}
      <div className="relative flex-1">
        {/* Highlighted layer */}
        <pre
          ref={preRef}
          className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre p-3 font-mono text-[13px] leading-5"
          aria-hidden="true"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html:
              highlighted ||
              `<span style="color:var(--th-fg-faint)">${placeholder ?? ""}</span>`,
          }}
        />

        {/* Transparent textarea */}
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
          style={{ minHeight, caretColor: "var(--th-editor-caret)" }}
          placeholder={!value ? placeholder : undefined}
        />
      </div>

      {/* Line count badge */}
      {lineCount > 30 && (
        <div
          className="absolute bottom-2 right-2 z-20 rounded px-1.5 py-0.5 font-mono text-[10px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{
            backgroundColor: "var(--th-pill-bg)",
            color: "var(--th-fg-faint)",
          }}
        >
          {lineCount} lines
        </div>
      )}

      {children}
    </div>
  );
}

export { CodeEditor };
