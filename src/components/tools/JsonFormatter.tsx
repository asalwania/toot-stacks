"use client";

import { useState, useCallback, useMemo } from "react";
import CodeEditor from "@/components/ui/CodeEditor";
import JsonTreeView from "@/components/ui/JsonTreeView";
import CopyButton from "@/components/ui/CopyButton";
import { highlightJSON } from "@/lib/json-highlight";
import {
  parseJSON,
  byteLength,
  formatSize,
  describeJSON,
} from "@/lib/json-parser";

/* ================================================================== */
/*  Stats Bar                                                          */
/* ================================================================== */

function StatsBar({ input, output }: { input: string; output: string }) {
  const inputLines = input ? input.split("\n").length : 0;
  const inputSize = byteLength(input);
  const outputSize = output ? byteLength(output) : 0;
  const savings =
    inputSize > 0 && outputSize > 0
      ? Math.round(((inputSize - outputSize) / inputSize) * 100)
      : null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-(--th-fg-faint)">
      <span>{inputLines} lines</span>
      <span>{formatSize(inputSize)}</span>
      {output && <span>&rarr; {formatSize(outputSize)}</span>}
      {savings !== null && savings !== 0 && (
        <span
          className={
            savings > 0 ? "text-emerald-500" : "text-amber-500"
          }
        >
          {savings > 0
            ? `${savings}% smaller`
            : `${Math.abs(savings)}% larger`}
        </span>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Mode type                                                          */
/* ================================================================== */

type Mode = "format" | "validate" | "tree";

const MODES: { id: Mode; label: string }[] = [
  { id: "format", label: "Format" },
  { id: "validate", label: "Validate" },
  { id: "tree", label: "Tree View" },
];

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

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

  /* ---- Derived auto-format result ---- */
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

  /* ---- Actions ---- */
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

  /* ---- Derived data ---- */
  const treeData = useMemo(() => {
    if (!input.trim()) return undefined;
    try {
      return JSON.parse(input);
    } catch {
      return undefined;
    }
  }, [input]);

  const validation = useMemo(() => {
    if (!input.trim()) return null;
    const result = parseJSON(input);
    if (result.ok) {
      const { type, detail } = describeJSON(result.data);
      return { valid: true as const, type, detail };
    }
    return {
      valid: false as const,
      error: result.error,
      line: result.line,
      column: result.column,
    };
  }, [input]);

  /* ---- Render ---- */
  return (
    <div className="space-y-4">
      {/* ---- Toolbar ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Mode tabs */}
        <div className="inline-flex rounded-xl border border-(--th-border-hover) bg-(--th-pill-bg) p-1">
          {MODES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                mode === id
                  ? "bg-(--th-btn-ghost-hover) text-(--th-fg-heading)"
                  : "text-(--th-fg-faint) hover:text-(--th-fg-muted)"
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
              {/* Indent selector */}
              <div className="flex items-center rounded-lg border border-(--th-border-hover) bg-(--th-pill-bg)">
                <span className="px-2.5 text-xs text-(--th-fg-faint)">
                  Indent
                </span>
                {([2, 4] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setIndent(n)}
                    className={`cursor-pointer px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 ${
                      indent === n
                        ? "bg-primary-500/20 text-primary-400"
                        : "text-(--th-fg-faint) hover:text-(--th-fg-heading)"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                onClick={handleFormat}
                className="cursor-pointer rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                Format
              </button>
              <button
                onClick={handleMinify}
                className="cursor-pointer rounded-lg border border-(--th-border-hover) bg-(--th-pill-bg) px-3 py-1.5 text-xs font-medium text-(--th-fg-muted) transition-colors duration-200 hover:bg-(--th-btn-ghost-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                Minify
              </button>
            </>
          )}

          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-(--th-fg-faint)">
            <input
              type="checkbox"
              checked={autoFormat}
              onChange={(e) => setAutoFormat(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-primary-500"
            />
            Auto
          </label>

          <div className="h-4 w-px bg-(--th-border-hover)" />

          <button
            onClick={handleClear}
            className="cursor-pointer text-xs text-(--th-fg-faint) transition-colors duration-200 hover:text-red-400"
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
          <span className="text-lg">
            {validation.valid ? "✓" : "✕"}
          </span>
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
                    {validation.column != null &&
                      `, col ${validation.column}`}
                    )
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
            <span className="text-xs font-medium uppercase tracking-wider text-(--th-fg-faint)">
              Input
            </span>
            <StatsBar input={input} output="" />
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            placeholder={'{\n  "key": "value"\n}'}
            errorLine={error?.line ?? null}
            indentSize={indent}
            highlight={highlightJSON}
          />
        </div>

        {/* Right: Output / Tree */}
        <div className="relative flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-(--th-fg-faint)">
              {mode === "tree" ? "Tree View" : "Output"}
            </span>
            {output && mode !== "tree" && (
              <div className="absolute -top-4 right-0">
                <CopyButton text={output} label="Copy" />
              </div>
            )}
          </div>

          {mode === "tree" ? (
            <div
              className="flex-1 overflow-auto rounded-2xl border border-(--th-border) p-4 font-mono text-[13px] leading-5"
              style={{
                minHeight: 420,
                backgroundColor: "var(--th-editor-bg)",
              }}
            >
              {!input.trim() && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-(--th-fg-faint)">
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
                <JsonTreeView data={treeData} />
              )}
            </div>
          ) : output ? (
            <CodeEditor
              value={output}
              readOnly
              indentSize={indent}
              highlight={highlightJSON}
            />
          ) : (
            <div
              className="flex flex-1 items-center justify-center rounded-2xl border border-(--th-border) p-6"
              style={{
                minHeight: 420,
                backgroundColor: "var(--th-editor-bg)",
              }}
            >
              <div className="text-center">
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl font-mono text-lg text-(--th-fg-faint)"
                  style={{ backgroundColor: "var(--th-pill-bg)" }}
                >
                  {"{ }"}
                </div>
                <p className="text-sm text-(--th-fg-faint)">
                  {input.trim()
                    ? "Click Format or enable Auto to see output"
                    : "Formatted output will appear here"}
                </p>
              </div>
            </div>
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
