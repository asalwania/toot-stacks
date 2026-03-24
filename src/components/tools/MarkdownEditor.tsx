"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { marked } from "marked";

/* ================================================================== */
/*  Configure marked                                                    */
/* ================================================================== */

marked.setOptions({
  breaks: true,
  gfm: true,
});

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

type ViewMode = "split" | "edit" | "preview";

interface ToolbarAction {
  label: string;
  icon: string;
  shortcut?: string;
  action: (
    text: string,
    selStart: number,
    selEnd: number,
  ) => { text: string; cursor: number };
}

/* ================================================================== */
/*  Default content                                                     */
/* ================================================================== */

const DEFAULT_MD = `# Welcome to Markdown Editor

Write **Markdown** on the left, see the *rendered preview* on the right.

## Features

- **Live preview** — see changes as you type
- **Toolbar** — quick formatting without memorizing syntax
- **GFM support** — tables, task lists, strikethrough
- **Export** — copy Markdown or download as HTML
- **Keyboard shortcuts** — Ctrl+B, Ctrl+I, and more

## Try it out

### Code blocks

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Tables

| Feature       | Status |
| ------------- | ------ |
| Live preview  | ✅      |
| GFM tables    | ✅      |
| Task lists    | ✅      |
| Export HTML    | ✅      |

### Task list

- [x] Write some Markdown
- [x] See it rendered instantly
- [ ] Share with the world

### Blockquote

> "The best way to predict the future is to invent it." — Alan Kay

---

Start editing to see the magic! ✨
`;

/* ================================================================== */
/*  Toolbar definitions                                                 */
/* ================================================================== */

const toolbarActions: ToolbarAction[] = [
  {
    label: "Bold",
    icon: "B",
    shortcut: "Ctrl+B",
    action: (text, s, e) => {
      const selected = text.slice(s, e);
      const wrapped = `**${selected || "bold text"}**`;
      return {
        text: text.slice(0, s) + wrapped + text.slice(e),
        cursor: selected ? s + wrapped.length : s + 2,
      };
    },
  },
  {
    label: "Italic",
    icon: "I",
    shortcut: "Ctrl+I",
    action: (text, s, e) => {
      const selected = text.slice(s, e);
      const wrapped = `*${selected || "italic text"}*`;
      return {
        text: text.slice(0, s) + wrapped + text.slice(e),
        cursor: selected ? s + wrapped.length : s + 1,
      };
    },
  },
  {
    label: "Strikethrough",
    icon: "S̶",
    action: (text, s, e) => {
      const selected = text.slice(s, e);
      const wrapped = `~~${selected || "strikethrough"}~~`;
      return {
        text: text.slice(0, s) + wrapped + text.slice(e),
        cursor: selected ? s + wrapped.length : s + 2,
      };
    },
  },
  {
    label: "Heading",
    icon: "H",
    action: (text, s, e) => {
      const lineStart = text.lastIndexOf("\n", s - 1) + 1;
      const line = text.slice(lineStart, e);
      const match = line.match(/^(#{1,5})\s/);
      const prefix = match ? "#".repeat(match[1].length + 1) + " " : "## ";
      const cleanLine = line.replace(/^#{1,6}\s*/, "");
      const result =
        text.slice(0, lineStart) + prefix + cleanLine + text.slice(e);
      return { text: result, cursor: lineStart + prefix.length + cleanLine.length };
    },
  },
  {
    label: "Link",
    icon: "🔗",
    action: (text, s, e) => {
      const selected = text.slice(s, e);
      const wrapped = `[${selected || "link text"}](url)`;
      return {
        text: text.slice(0, s) + wrapped + text.slice(e),
        cursor: selected ? s + selected.length + 3 : s + 1,
      };
    },
  },
  {
    label: "Image",
    icon: "🖼",
    action: (text, s, e) => {
      const selected = text.slice(s, e);
      const wrapped = `![${selected || "alt text"}](image-url)`;
      return {
        text: text.slice(0, s) + wrapped + text.slice(e),
        cursor: selected ? s + selected.length + 4 : s + 2,
      };
    },
  },
  {
    label: "Code",
    icon: "</>",
    action: (text, s, e) => {
      const selected = text.slice(s, e);
      if (selected.includes("\n")) {
        const wrapped = "```\n" + selected + "\n```";
        return {
          text: text.slice(0, s) + wrapped + text.slice(e),
          cursor: s + wrapped.length,
        };
      }
      const wrapped = "`" + (selected || "code") + "`";
      return {
        text: text.slice(0, s) + wrapped + text.slice(e),
        cursor: selected ? s + wrapped.length : s + 1,
      };
    },
  },
  {
    label: "Unordered List",
    icon: "•",
    action: (text, s, e) => {
      const selected = text.slice(s, e) || "List item";
      const lines = selected.split("\n").map((l) => `- ${l}`).join("\n");
      return {
        text: text.slice(0, s) + lines + text.slice(e),
        cursor: s + lines.length,
      };
    },
  },
  {
    label: "Ordered List",
    icon: "1.",
    action: (text, s, e) => {
      const selected = text.slice(s, e) || "List item";
      const lines = selected
        .split("\n")
        .map((l, i) => `${i + 1}. ${l}`)
        .join("\n");
      return {
        text: text.slice(0, s) + lines + text.slice(e),
        cursor: s + lines.length,
      };
    },
  },
  {
    label: "Task List",
    icon: "☑",
    action: (text, s, e) => {
      const selected = text.slice(s, e) || "Task item";
      const lines = selected.split("\n").map((l) => `- [ ] ${l}`).join("\n");
      return {
        text: text.slice(0, s) + lines + text.slice(e),
        cursor: s + lines.length,
      };
    },
  },
  {
    label: "Blockquote",
    icon: "❝",
    action: (text, s, e) => {
      const selected = text.slice(s, e) || "Quote";
      const lines = selected.split("\n").map((l) => `> ${l}`).join("\n");
      return {
        text: text.slice(0, s) + lines + text.slice(e),
        cursor: s + lines.length,
      };
    },
  },
  {
    label: "Horizontal Rule",
    icon: "—",
    action: (text, s) => {
      const insert = "\n\n---\n\n";
      return {
        text: text.slice(0, s) + insert + text.slice(s),
        cursor: s + insert.length,
      };
    },
  },
  {
    label: "Table",
    icon: "⊞",
    action: (text, s) => {
      const table =
        "\n| Header 1 | Header 2 | Header 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n";
      return {
        text: text.slice(0, s) + table + text.slice(s),
        cursor: s + table.length,
      };
    },
  },
];

/* ================================================================== */
/*  Component                                                           */
/* ================================================================== */

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(DEFAULT_MD);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0, lines: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  /* ---- Word count ---- */
  useEffect(() => {
    const trimmed = markdown.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = markdown.length;
    const lines = markdown.split("\n").length;
    setWordCount({ words, chars, lines });
  }, [markdown]);

  /* ---- Render HTML ---- */
  const renderedHtml = useMemo(() => {
    try {
      return marked.parse(markdown) as string;
    } catch {
      return "<p style='color:#f87171;'>Error rendering Markdown</p>";
    }
  }, [markdown]);

  /* ---- Toolbar click ---- */
  const handleToolbarAction = useCallback(
    (action: ToolbarAction["action"]) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const { selectionStart, selectionEnd } = ta;
      const result = action(markdown, selectionStart, selectionEnd);
      setMarkdown(result.text);
      requestAnimationFrame(() => {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = result.cursor;
      });
    },
    [markdown],
  );

  /* ---- Keyboard shortcuts ---- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      if (e.key === "b") {
        e.preventDefault();
        handleToolbarAction(toolbarActions[0].action);
      } else if (e.key === "i") {
        e.preventDefault();
        handleToolbarAction(toolbarActions[1].action);
      }
    },
    [handleToolbarAction],
  );

  /* ---- Tab support ---- */
  const handleTab = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const { selectionStart: s, selectionEnd: end } = ta;
        const newText = markdown.slice(0, s) + "  " + markdown.slice(end);
        setMarkdown(newText);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = s + 2;
        });
      }
    },
    [markdown],
  );

  /* ---- Copy / Export ---- */
  const copyMarkdown = useCallback(() => {
    navigator.clipboard.writeText(markdown);
  }, [markdown]);

  const copyHtml = useCallback(() => {
    navigator.clipboard.writeText(renderedHtml);
  }, [renderedHtml]);

  const downloadHtml = useCallback(() => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Markdown Export</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; }
  pre { background: #f4f4f5; padding: 1rem; border-radius: 8px; overflow-x: auto; }
  code { background: #f4f4f5; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 4px solid #6366f1; margin: 1rem 0; padding: 0.5rem 1rem; color: #555; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f4f4f5; }
  img { max-width: 100%; }
  hr { border: none; border-top: 2px solid #e5e5e5; margin: 2rem 0; }
</style>
</head>
<body>
${renderedHtml}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "markdown-export.html";
    a.click();
    URL.revokeObjectURL(url);
  }, [renderedHtml]);

  /* ---- Scroll sync ---- */
  const handleEditorScroll = useCallback(() => {
    const ta = textareaRef.current;
    const pv = previewRef.current;
    if (!ta || !pv) return;
    const ratio = ta.scrollTop / (ta.scrollHeight - ta.clientHeight || 1);
    pv.scrollTop = ratio * (pv.scrollHeight - pv.clientHeight);
  }, []);

  const showEditor = viewMode === "split" || viewMode === "edit";
  const showPreview = viewMode === "split" || viewMode === "preview";

  return (
    <div className="flex flex-col gap-4">
      {/* ---- Top bar: view toggle + actions ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {/* View mode tabs */}
        <div
          className="flex rounded-xl p-1"
          style={{ backgroundColor: "var(--th-pill-bg)" }}
        >
          {(["edit", "split", "preview"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all duration-200 sm:flex-none ${
                viewMode === mode
                  ? "bg-primary-500 text-white shadow-md shadow-primary-500/25"
                  : "text-(--th-fg-muted) hover:text-(--th-fg-heading)"
              }`}
            >
              {mode === "split" ? "Split" : mode === "edit" ? "Editor" : "Preview"}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyMarkdown}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-200 hover:bg-(--th-pill-bg)"
            style={{ color: "var(--th-fg-muted)" }}
            title="Copy Markdown"
          >
            Copy MD
          </button>
          <button
            onClick={copyHtml}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-200 hover:bg-(--th-pill-bg)"
            style={{ color: "var(--th-fg-muted)" }}
            title="Copy HTML"
          >
            Copy HTML
          </button>
          <button
            onClick={downloadHtml}
            className="cursor-pointer rounded-lg bg-primary-500/10 px-3 py-1.5 text-xs sm:text-sm font-medium text-primary-400 transition-colors duration-200 hover:bg-primary-500/20"
            title="Download as HTML file"
          >
            Export HTML
          </button>
        </div>
      </div>

      {/* ---- Toolbar ---- */}
      {showEditor && (
        <div
          className="flex items-center gap-1 overflow-x-auto rounded-xl border border-(--th-border) px-2 py-1.5 sm:flex-wrap sm:overflow-x-visible"
          style={{ backgroundColor: "var(--th-card)" }}
        >
          {toolbarActions.map((action, i) => (
            <button
              key={action.label}
              onClick={() => handleToolbarAction(action.action)}
              className={`shrink-0 cursor-pointer rounded-lg px-2 py-1.5 text-sm font-medium transition-all duration-200 hover:bg-(--th-pill-bg) hover:text-(--th-fg-heading) sm:px-2.5 ${
                i === 3 || i === 4 || i === 7 || i === 10 || i === 12
                  ? "sm:ml-1 sm:border-l sm:border-(--th-border) sm:pl-3"
                  : ""
              }`}
              style={{ color: "var(--th-fg-muted)" }}
              title={
                action.shortcut
                  ? `${action.label} (${action.shortcut})`
                  : action.label
              }
            >
              <span
                className={
                  action.icon === "B"
                    ? "font-bold"
                    : action.icon === "I"
                      ? "italic"
                      : action.icon === "S̶"
                        ? "line-through"
                        : ""
                }
              >
                {action.icon}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ---- Editor + Preview split ---- */}
      <div
        className={`grid gap-4 ${
          viewMode === "split"
            ? "grid-cols-1 lg:grid-cols-2"
            : "grid-cols-1"
        }`}
        style={{ minHeight: "min(520px, 70vh)" }}
      >
        {/* Editor pane */}
        {showEditor && (
          <div className="flex flex-col overflow-hidden rounded-2xl border border-(--th-border)">
            <div
              className="flex items-center justify-between border-b border-(--th-border) px-4 py-2"
              style={{ backgroundColor: "var(--th-card)" }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--th-fg-muted)" }}
              >
                Markdown
              </span>
              <span
                className="text-xs tabular-nums"
                style={{ color: "var(--th-fg-faint)" }}
              >
                {wordCount.words} words · {wordCount.chars} chars · {wordCount.lines} lines
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              onScroll={handleEditorScroll}
              onKeyDown={(e) => {
                handleKeyDown(e);
                handleTab(e);
              }}
              spellCheck={false}
              className="flex-1 resize-none bg-transparent p-4 font-mono text-[13px] leading-6 outline-none selection:bg-primary-500/30"
              style={{
                minHeight: 480,
                color: "var(--th-fg)",
                backgroundColor: "var(--th-editor-bg)",
                caretColor: "var(--th-editor-caret)",
              }}
              placeholder="Start typing Markdown here..."
            />
          </div>
        )}

        {/* Preview pane */}
        {showPreview && (
          <div className="flex flex-col overflow-hidden rounded-2xl border border-(--th-border)">
            <div
              className="flex items-center border-b border-(--th-border) px-4 py-2"
              style={{ backgroundColor: "var(--th-card)" }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--th-fg-muted)" }}
              >
                Preview
              </span>
            </div>
            <div
              ref={previewRef}
              className="markdown-preview flex-1 overflow-y-auto p-6"
              style={{
                minHeight: 480,
                backgroundColor: "var(--th-editor-bg)",
              }}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
