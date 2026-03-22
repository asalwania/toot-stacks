"use client";

import { useState, useCallback, useMemo } from "react";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import { CopyButton } from "@/components/ui/CopyButton";
import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/*  Tree View (recursive, no library)                                  */
/* ------------------------------------------------------------------ */

interface TreeNodeProps {
  label: string;
  value: unknown;
  depth: number;
  defaultExpanded?: boolean;
}

function TreeNode({ label, value, depth, defaultExpanded = true }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded && depth < 3);

  const isObject = value !== null && typeof value === "object";
  const isArray = Array.isArray(value);
  const entries = isObject
    ? isArray
      ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
      : Object.entries(value as Record<string, unknown>)
    : [];

  const toggle = () => setExpanded((e) => !e);

  if (!isObject) {
    const color =
      typeof value === "string"
        ? "text-green-600 dark:text-green-400"
        : typeof value === "number"
          ? "text-blue-600 dark:text-blue-400"
          : typeof value === "boolean"
            ? "text-purple-600 dark:text-purple-400"
            : "text-zinc-400";
    const display =
      typeof value === "string" ? `"${value}"` : String(value);

    return (
      <div className="flex gap-1 py-0.5" style={{ paddingLeft: depth * 20 }}>
        {label && (
          <span className="text-zinc-500 dark:text-zinc-400 shrink-0">
            {label}:&nbsp;
          </span>
        )}
        <span className={color}>{display}</span>
      </div>
    );
  }

  const bracket = isArray ? ["[", "]"] : ["{", "}"];
  const count = entries.length;

  return (
    <div style={{ paddingLeft: depth * 20 }}>
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded px-1 -ml-1 text-left w-full"
      >
        <span
          className="inline-block w-4 text-center text-xs text-zinc-400 transition-transform"
          style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          &#9654;
        </span>
        {label && (
          <span className="text-zinc-500 dark:text-zinc-400">{label}:</span>
        )}
        <span className="text-zinc-400 text-sm">
          {bracket[0]}
          {!expanded && (
            <span className="text-zinc-400">
              {" "}
              {count} {count === 1 ? "item" : "items"}{" "}
            </span>
          )}
          {!expanded && bracket[1]}
        </span>
      </button>
      {expanded && (
        <>
          {entries.map(([key, val]) => (
            <TreeNode
              key={key}
              label={isArray ? `[${key}]` : key}
              value={val}
              depth={depth + 1}
              defaultExpanded={depth < 2}
            />
          ))}
          <div
            className="text-zinc-400 text-sm py-0.5"
            style={{ paddingLeft: 20 }}
          >
            {bracket[1]}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Line-numbered textarea                                             */
/* ------------------------------------------------------------------ */

function LineNumberedTextarea({
  value,
  onChange,
  placeholder,
  readOnly = false,
  errorLine,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  errorLine?: number | null;
}) {
  const lines = value.split("\n");
  const lineCount = lines.length || 1;

  return (
    <div className="relative flex rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden font-mono text-sm h-[400px]">
      {/* line numbers gutter */}
      <div
        className="select-none text-right text-zinc-400 dark:text-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 border-r border-zinc-200 dark:border-zinc-700 py-3 px-2 overflow-hidden leading-5"
        aria-hidden
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div
            key={i}
            className={
              errorLine === i + 1
                ? "bg-red-100 dark:bg-red-900/40 text-red-500 -mx-2 px-2"
                : ""
            }
          >
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        spellCheck={false}
        className="flex-1 resize-none p-3 leading-5 bg-transparent outline-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 overflow-auto"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const TABS = ["Format", "Validate", "Tree View"] as const;
type Tab = (typeof TABS)[number];

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("Format");
  const [indent, setIndent] = useState<2 | 4>(2);
  const [error, setError] = useState<{
    message: string;
    line?: number;
    column?: number;
  } | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
    line?: number;
    column?: number;
  } | null>(null);

  /* ---- helpers --------------------------------------------------- */

  const parseJSON = useCallback(
    (text: string): { ok: true; data: unknown } | { ok: false; error: string; line?: number; column?: number } => {
      try {
        const data = JSON.parse(text);
        return { ok: true, data };
      } catch (e) {
        const msg = (e as Error).message;
        // Try to extract position info - JSON.parse errors often contain "at position N"
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
    },
    []
  );

  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      setError({ message: "Input is empty" });
      setOutput("");
      return;
    }
    const result = parseJSON(input);
    if (result.ok) {
      setOutput(JSON.stringify(result.data, null, indent));
      setError(null);
    } else {
      setError({
        message: result.error,
        line: result.line,
        column: result.column,
      });
      setOutput("");
    }
  }, [input, indent, parseJSON]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      setError({ message: "Input is empty" });
      setOutput("");
      return;
    }
    const result = parseJSON(input);
    if (result.ok) {
      setOutput(JSON.stringify(result.data));
      setError(null);
    } else {
      setError({
        message: result.error,
        line: result.line,
        column: result.column,
      });
      setOutput("");
    }
  }, [input, parseJSON]);

  const handleValidate = useCallback(() => {
    if (!input.trim()) {
      setValidationResult({ valid: false, message: "Input is empty" });
      return;
    }
    const result = parseJSON(input);
    if (result.ok) {
      const type = Array.isArray(result.data)
        ? "array"
        : typeof result.data === "object" && result.data !== null
          ? "object"
          : typeof result.data;
      const size =
        type === "array"
          ? `${(result.data as unknown[]).length} items`
          : type === "object"
            ? `${Object.keys(result.data as object).length} keys`
            : "";
      setValidationResult({
        valid: true,
        message: `Valid JSON (${type}${size ? `, ${size}` : ""})`,
      });
    } else {
      setValidationResult({
        valid: false,
        message: result.error,
        line: result.line,
        column: result.column,
      });
    }
  }, [input, parseJSON]);

  /* ---- tree view parsed data ------------------------------------- */

  const treeData = useMemo(() => {
    if (!input.trim()) return undefined;
    try {
      return JSON.parse(input);
    } catch {
      return undefined;
    }
  }, [input]);

  /* ---- render ---------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Mode Tabs */}
      <TabSwitcher
        tabs={TABS as unknown as string[]}
        activeTab={activeTab}
        onChange={(t) => {
          setActiveTab(t as Tab);
          setError(null);
          setValidationResult(null);
        }}
      />

      {/* Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          JSON Input
        </label>
        <LineNumberedTextarea
          value={input}
          onChange={setInput}
          placeholder='Paste your JSON here, e.g. {"key": "value"}'
          errorLine={
            error?.line ?? validationResult?.line ?? null
          }
        />
      </div>

      {/* ---- Format tab ------------------------------------------- */}
      {activeTab === "Format" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Indent selector */}
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span>Indent:</span>
              <button
                type="button"
                onClick={() => setIndent(2)}
                className={`px-2 py-1 rounded ${
                  indent === 2
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                2
              </button>
              <button
                type="button"
                onClick={() => setIndent(4)}
                className={`px-2 py-1 rounded ${
                  indent === 4
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                4
              </button>
            </div>

            <Button onClick={handleFormat}>Format (Pretty Print)</Button>
            <Button onClick={handleMinify} variant="secondary">
              Minify
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
              <span className="font-semibold">Error:</span> {error.message}
              {error.line != null && (
                <span className="ml-2 text-red-500">
                  (line {error.line}
                  {error.column != null && `, col ${error.column}`})
                </span>
              )}
            </div>
          )}

          {/* Output */}
          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Output
                </label>
                <CopyButton text={output} />
              </div>
              <LineNumberedTextarea value={output} readOnly />
            </div>
          )}
        </div>
      )}

      {/* ---- Validate tab ----------------------------------------- */}
      {activeTab === "Validate" && (
        <div className="space-y-4">
          <Button onClick={handleValidate}>Validate JSON</Button>

          {validationResult && (
            <div
              className={`rounded-lg border p-4 text-sm ${
                validationResult.valid
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {validationResult.valid ? "\u2713" : "\u2717"}
                </span>
                <span className="font-semibold">
                  {validationResult.valid ? "Valid" : "Invalid"}
                </span>
              </div>
              <p className="mt-1">{validationResult.message}</p>
              {validationResult.line != null && (
                <p className="mt-1 text-xs opacity-75">
                  Line {validationResult.line}
                  {validationResult.column != null &&
                    `, Column ${validationResult.column}`}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---- Tree View tab ---------------------------------------- */}
      {activeTab === "Tree View" && (
        <div className="space-y-4">
          {!input.trim() && (
            <p className="text-sm text-zinc-500">
              Paste JSON in the input above to see the tree view.
            </p>
          )}
          {input.trim() && !treeData && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
              Invalid JSON &mdash; fix errors to see the tree view.
            </div>
          )}
          {treeData !== undefined && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 overflow-auto max-h-[600px] font-mono text-sm">
              <TreeNode label="" value={treeData} depth={0} defaultExpanded />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
