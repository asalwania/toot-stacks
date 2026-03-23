"use client";

import { useState } from "react";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

export interface JsonTreeViewProps {
  /** Parsed JSON data to render. */
  data: unknown;
  /** Max auto-expand depth. Default 3. */
  defaultExpandDepth?: number;
}

/* ================================================================== */
/*  Tree Node (recursive)                                              */
/* ================================================================== */

function TreeNode({
  label,
  value,
  depth,
  defaultOpen,
}: {
  label: string;
  value: unknown;
  depth: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isObj = value !== null && typeof value === "object";
  const isArr = Array.isArray(value);
  const entries = isObj
    ? isArr
      ? (value as unknown[]).map(
          (v, i) => [String(i), v] as [string, unknown]
        )
      : Object.entries(value as Record<string, unknown>)
    : [];

  /* Leaf node */
  if (!isObj) {
    const color =
      typeof value === "string"
        ? "text-(--th-syn-string)"
        : typeof value === "number"
          ? "text-(--th-syn-number)"
          : typeof value === "boolean"
            ? "text-(--th-syn-bool)"
            : "text-(--th-syn-bool)"; // null
    const display =
      typeof value === "string" ? `"${value}"` : String(value);

    return (
      <div className="flex gap-1 py-px" style={{ paddingLeft: depth * 18 }}>
        {label && (
          <span className="text-(--th-syn-key)">{label}:&nbsp;</span>
        )}
        <span className={color}>{display}</span>
      </div>
    );
  }

  /* Object / Array node */
  const bracket = isArr ? ["[", "]"] : ["{", "}"];

  return (
    <div style={{ paddingLeft: depth * 18 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="-ml-1 flex w-full cursor-pointer items-center gap-1 rounded px-1 py-px text-left transition-colors duration-150 hover:bg-(--th-btn-ghost-hover)"
      >
        <span
          className="inline-block w-3.5 text-center text-[10px] text-(--th-fg-faint) transition-transform duration-150"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </span>
        {label && <span className="text-(--th-syn-key)">{label}:</span>}
        <span className="text-(--th-syn-bracket)">
          {bracket[0]}
          {!open && (
            <span className="text-(--th-fg-faint)">
              {" "}
              {entries.length}{" "}
              {entries.length === 1 ? "item" : "items"}{" "}
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
              label={isArr ? k : k}
              value={v}
              depth={depth + 1}
              defaultOpen={depth + 1 < 3}
            />
          ))}
          <div
            className="py-px text-(--th-syn-bracket)"
            style={{ paddingLeft: 18 }}
          >
            {bracket[1]}
          </div>
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Public component                                                   */
/* ================================================================== */

export default function JsonTreeView({
  data,
  defaultExpandDepth = 3,
}: JsonTreeViewProps) {
  return (
    <TreeNode
      label=""
      value={data}
      depth={0}
      defaultOpen={defaultExpandDepth > 0}
    />
  );
}

export { JsonTreeView };
