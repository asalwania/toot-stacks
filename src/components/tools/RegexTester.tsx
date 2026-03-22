"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { TabSwitcher } from "@/components/ui/TabSwitcher";

interface RegexMatch {
  fullMatch: string;
  groups: (string | undefined)[];
  index: number;
}

const COMMON_PATTERNS = [
  { name: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", flags: "g" },
  { name: "URL", pattern: "https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+", flags: "gi" },
  { name: "Phone (US)", pattern: "\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}", flags: "g" },
  { name: "IPv4 Address", pattern: "\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b", flags: "g" },
  { name: "Date (YYYY-MM-DD)", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])", flags: "g" },
  { name: "Date (MM/DD/YYYY)", pattern: "(?:0[1-9]|1[0-2])/(?:0[1-9]|[12]\\d|3[01])/\\d{4}", flags: "g" },
  { name: "HTML Tag", pattern: "<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>.*?</\\1>", flags: "gs" },
  { name: "Hex Color", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", flags: "gi" },
  { name: "Username", pattern: "^[a-zA-Z0-9_]{3,16}$", flags: "gm" },
  { name: "Strong Password", pattern: "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}", flags: "g" },
  { name: "Slug", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", flags: "gm" },
  { name: "Whitespace Trim", pattern: "^\\s+|\\s+$", flags: "gm" },
];

function explainRegex(pattern: string): string[] {
  const explanations: string[] = [];
  let i = 0;
  const len = pattern.length;

  while (i < len) {
    const ch = pattern[i];

    if (ch === "^") {
      explanations.push("^ : Start of string/line");
      i++;
    } else if (ch === "$") {
      explanations.push("$ : End of string/line");
      i++;
    } else if (ch === ".") {
      explanations.push(". : Any character (except newline by default)");
      i++;
    } else if (ch === "\\") {
      i++;
      if (i < len) {
        const next = pattern[i];
        const escapes: Record<string, string> = {
          d: "\\d : Any digit (0-9)",
          D: "\\D : Any non-digit",
          w: "\\w : Any word character (letter, digit, underscore)",
          W: "\\W : Any non-word character",
          s: "\\s : Any whitespace (space, tab, newline)",
          S: "\\S : Any non-whitespace",
          b: "\\b : Word boundary",
          B: "\\B : Non-word boundary",
          n: "\\n : Newline",
          t: "\\t : Tab",
          r: "\\r : Carriage return",
        };
        if (escapes[next]) {
          explanations.push(escapes[next]);
        } else {
          explanations.push(`\\${next} : Literal '${next}'`);
        }
        i++;
      }
    } else if (ch === "[") {
      let end = i + 1;
      if (end < len && pattern[end] === "^") end++;
      if (end < len && pattern[end] === "]") end++;
      while (end < len && pattern[end] !== "]") {
        if (pattern[end] === "\\") end++;
        end++;
      }
      const charClass = pattern.slice(i, end + 1);
      const isNegated = charClass[1] === "^";
      explanations.push(
        `${charClass} : ${isNegated ? "Any character NOT in" : "Any character in"} the set`
      );
      i = end + 1;
    } else if (ch === "(") {
      let groupDesc = "( : Start of capturing group";
      if (pattern[i + 1] === "?") {
        if (pattern[i + 2] === ":") {
          groupDesc = "(?: : Start of non-capturing group";
          i += 3;
        } else if (pattern[i + 2] === "=") {
          groupDesc = "(?= : Positive lookahead";
          i += 3;
        } else if (pattern[i + 2] === "!") {
          groupDesc = "(?! : Negative lookahead";
          i += 3;
        } else if (pattern[i + 2] === "<" && pattern[i + 3] === "=") {
          groupDesc = "(?<= : Positive lookbehind";
          i += 4;
        } else if (pattern[i + 2] === "<" && pattern[i + 3] === "!") {
          groupDesc = "(?<! : Negative lookbehind";
          i += 4;
        } else {
          i += 1;
        }
      } else {
        i += 1;
      }
      explanations.push(groupDesc);
    } else if (ch === ")") {
      explanations.push(") : End of group");
      i++;
    } else if (ch === "*") {
      const lazy = pattern[i + 1] === "?";
      explanations.push(lazy ? "*? : Zero or more (lazy)" : "* : Zero or more (greedy)");
      i += lazy ? 2 : 1;
    } else if (ch === "+") {
      const lazy = pattern[i + 1] === "?";
      explanations.push(lazy ? "+? : One or more (lazy)" : "+ : One or more (greedy)");
      i += lazy ? 2 : 1;
    } else if (ch === "?") {
      explanations.push("? : Optional (zero or one)");
      i++;
    } else if (ch === "{") {
      let end = i + 1;
      while (end < len && pattern[end] !== "}") end++;
      const quantifier = pattern.slice(i, end + 1);
      const inner = quantifier.slice(1, -1);
      if (inner.includes(",")) {
        const [min, max] = inner.split(",");
        explanations.push(
          max.trim()
            ? `${quantifier} : Between ${min} and ${max.trim()} times`
            : `${quantifier} : ${min} or more times`
        );
      } else {
        explanations.push(`${quantifier} : Exactly ${inner} times`);
      }
      i = end + 1;
    } else if (ch === "|") {
      explanations.push("| : OR (alternation)");
      i++;
    } else {
      // Collect consecutive literal characters
      let literal = ch;
      let j = i + 1;
      while (
        j < len &&
        !"^$.*+?{}[]()|\\/".includes(pattern[j])
      ) {
        literal += pattern[j];
        j++;
      }
      if (literal.length === 1) {
        explanations.push(`${literal} : Literal '${literal}'`);
      } else {
        explanations.push(`${literal} : Literal "${literal}"`);
      }
      i = j;
    }
  }

  return explanations;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const HIGHLIGHT_COLORS = [
  "bg-yellow-200 dark:bg-yellow-800/60",
  "bg-green-200 dark:bg-green-800/60",
  "bg-blue-200 dark:bg-blue-800/60",
  "bg-pink-200 dark:bg-pink-800/60",
  "bg-purple-200 dark:bg-purple-800/60",
  "bg-orange-200 dark:bg-orange-800/60",
];

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false, u: false });
  const [testString, setTestString] = useState("");
  const [activeTab, setActiveTab] = useState<"match" | "replace">("match");
  const [replacement, setReplacement] = useState("");

  const flagString = useMemo(
    () =>
      Object.entries(flags)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(""),
    [flags]
  );

  const { regex, error } = useMemo(() => {
    if (!pattern) return { regex: null, error: null };
    try {
      const r = new RegExp(pattern, flagString);
      return { regex: r, error: null };
    } catch (e) {
      return { regex: null, error: (e as Error).message };
    }
  }, [pattern, flagString]);

  const matches: RegexMatch[] = useMemo(() => {
    if (!regex || !testString) return [];
    const results: RegexMatch[] = [];
    if (flags.g) {
      let match: RegExpExecArray | null;
      const r = new RegExp(regex.source, regex.flags);
      let safety = 0;
      while ((match = r.exec(testString)) !== null && safety < 10000) {
        safety++;
        results.push({
          fullMatch: match[0],
          groups: match.slice(1),
          index: match.index,
        });
        if (match[0].length === 0) r.lastIndex++;
      }
    } else {
      const match = regex.exec(testString);
      if (match) {
        results.push({
          fullMatch: match[0],
          groups: match.slice(1),
          index: match.index,
        });
      }
    }
    return results;
  }, [regex, testString, flags.g]);

  const highlightedHtml = useMemo(() => {
    if (!regex || !testString || matches.length === 0) return escapeHtml(testString);

    const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
    let html = "";
    let lastIndex = 0;

    sortedMatches.forEach((match, i) => {
      const start = match.index;
      const end = start + match.fullMatch.length;
      if (start < lastIndex) return; // skip overlapping

      html += escapeHtml(testString.slice(lastIndex, start));
      const color = HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length];
      html += `<mark class="${color} rounded px-0.5">${escapeHtml(match.fullMatch)}</mark>`;
      lastIndex = end;
    });

    html += escapeHtml(testString.slice(lastIndex));
    return html;
  }, [regex, testString, matches]);

  const replaceResult = useMemo(() => {
    if (!regex || !testString || activeTab !== "replace") return "";
    try {
      return testString.replace(regex, replacement);
    } catch {
      return "";
    }
  }, [regex, testString, replacement, activeTab]);

  const explanationLines = useMemo(() => {
    if (!pattern) return [];
    return explainRegex(pattern);
  }, [pattern]);

  const toggleFlag = useCallback((flag: keyof typeof flags) => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
  }, []);

  const insertPattern = useCallback((p: string, f: string) => {
    setPattern(p);
    const newFlags = { g: false, i: false, m: false, s: false, u: false };
    for (const ch of f) {
      if (ch in newFlags) (newFlags as Record<string, boolean>)[ch] = true;
    }
    setFlags(newFlags);
  }, []);

  return (
    <div className="space-y-6">
      {/* Regex Input */}
      <div>
        <label className="text-sm font-medium text-zinc-700 mb-1 block dark:text-zinc-300">
          Regular Expression
        </label>
        <div className="flex gap-2 items-start">
          <div className="flex-1 relative">
            <div className="flex items-center rounded-xl border border-zinc-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900">
              <span className="text-zinc-400 pl-4 text-lg font-mono">/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Enter regex pattern..."
                className="flex-1 px-2 py-3 font-mono text-sm bg-transparent focus:outline-none text-zinc-900 dark:text-zinc-100"
              />
              <span className="text-zinc-400 text-lg font-mono">/</span>
              <span className="text-blue-600 font-mono text-sm pr-4 dark:text-blue-400">{flagString}</span>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <CopyButton text={`/${pattern}/${flagString}`} label="Copy" />
        </div>

        {/* Flag Toggles */}
        <div className="flex gap-2 mt-2">
          {(Object.keys(flags) as (keyof typeof flags)[]).map((flag) => (
            <button
              key={flag}
              onClick={() => toggleFlag(flag)}
              className={`w-9 h-9 rounded-lg font-mono text-sm font-bold border transition-colors ${
                flags[flag]
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-500"
                  : "border-zinc-200 text-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
              title={
                {
                  g: "Global - find all matches",
                  i: "Case insensitive",
                  m: "Multiline - ^ and $ match line starts/ends",
                  s: "Dotall - . matches newlines",
                  u: "Unicode",
                }[flag]
              }
            >
              {flag}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Tabs */}
      <TabSwitcher
        tabs={[
          { id: "match", label: "Match" },
          { id: "replace", label: "Replace" },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as "match" | "replace")}
      />

      {/* Test String with Highlighting */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Test String</label>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {matches.length} match{matches.length !== 1 ? "es" : ""}
          </span>
        </div>
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="Enter test string..."
          rows={4}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />

        {/* Highlighted preview */}
        {testString && matches.length > 0 && (
          <div
            className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-mono whitespace-pre-wrap break-all dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        )}
      </div>

      {/* Replace Mode */}
      {activeTab === "replace" && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1 block dark:text-zinc-300">
              Replacement String
            </label>
            <input
              type="text"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder="Replacement (use $1, $2 for groups)..."
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          {replaceResult && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Result</label>
                <CopyButton text={replaceResult} label="Copy Result" />
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-mono whitespace-pre-wrap break-all dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                {replaceResult}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Match Results */}
      {activeTab === "match" && matches.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3 dark:text-zinc-100">
            Match Results ({matches.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {matches.map((match, i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-400 font-mono text-xs">#{i + 1}</span>
                  <code className="font-mono text-zinc-900 dark:text-zinc-100">
                    &quot;{match.fullMatch}&quot;
                  </code>
                  <span className="text-xs text-zinc-400 ml-auto dark:text-zinc-500">
                    index: {match.index}
                  </span>
                </div>
                {match.groups.length > 0 && match.groups.some((g) => g !== undefined) && (
                  <div className="mt-1 pl-6 space-y-0.5">
                    {match.groups.map(
                      (group, gi) =>
                        group !== undefined && (
                          <div key={gi} className="text-xs">
                            <span className="text-zinc-400">Group {gi + 1}:</span>{" "}
                            <code className="text-blue-600 font-mono dark:text-blue-400">
                              &quot;{group}&quot;
                            </code>
                          </div>
                        )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regex Explanation */}
      {pattern && explanationLines.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3 dark:text-zinc-100">
            Pattern Explanation
          </h3>
          <ul className="space-y-1">
            {explanationLines.map((line, i) => {
              const [token, ...rest] = line.split(" : ");
              return (
                <li key={i} className="flex gap-3 text-sm">
                  <code className="font-mono text-blue-600 font-bold whitespace-nowrap dark:text-blue-400">
                    {token}
                  </code>
                  <span className="text-zinc-600 dark:text-zinc-400">{rest.join(" : ")}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Common Patterns Library */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3 dark:text-zinc-100">
          Common Patterns
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {COMMON_PATTERNS.map((cp) => (
            <button
              key={cp.name}
              onClick={() => insertPattern(cp.pattern, cp.flags)}
              className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-left hover:bg-zinc-100 transition-colors group dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{cp.name}</span>
              <span className="ml-auto text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity dark:text-zinc-500">
                Insert
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
