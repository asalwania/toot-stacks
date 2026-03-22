"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CronField {
  label: string;
  min: number;
  max: number;
  names?: string[];
}

const FIELDS: CronField[] = [
  { label: "Minute", min: 0, max: 59 },
  { label: "Hour", min: 0, max: 23 },
  { label: "Day of Month", min: 1, max: 31 },
  { label: "Month", min: 1, max: 12, names: MONTH_NAMES },
  { label: "Day of Week", min: 0, max: 6, names: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
];

const PRESETS = [
  { name: "Every Minute", expression: "* * * * *" },
  { name: "Every 5 Minutes", expression: "*/5 * * * *" },
  { name: "Every 15 Minutes", expression: "*/15 * * * *" },
  { name: "Every Hour", expression: "0 * * * *" },
  { name: "Daily at Midnight", expression: "0 0 * * *" },
  { name: "Daily at Noon", expression: "0 12 * * *" },
  { name: "Weekly (Sun Midnight)", expression: "0 0 * * 0" },
  { name: "Monthly (1st at Midnight)", expression: "0 0 1 * *" },
  { name: "Yearly (Jan 1 Midnight)", expression: "0 0 1 1 *" },
  { name: "Weekdays at 9am", expression: "0 9 * * 1-5" },
];

function parseCronField(value: string, field: CronField): { valid: boolean; error?: string } {
  if (value === "*") return { valid: true };
  // */n
  if (/^\*\/\d+$/.test(value)) {
    const n = parseInt(value.slice(2));
    if (n < 1 || n > field.max) return { valid: false, error: `Step must be 1-${field.max}` };
    return { valid: true };
  }
  // ranges and lists: 1,2,3 or 1-5 or 1-5,8,10
  const parts = value.split(",");
  for (const part of parts) {
    const rangeParts = part.split("-");
    if (rangeParts.length === 1) {
      const n = parseInt(part);
      if (isNaN(n) || n < field.min || n > field.max)
        return { valid: false, error: `Value must be ${field.min}-${field.max}` };
    } else if (rangeParts.length === 2) {
      const a = parseInt(rangeParts[0]);
      const b = parseInt(rangeParts[1]);
      if (isNaN(a) || isNaN(b) || a < field.min || b > field.max || a > b)
        return { valid: false, error: `Range must be ${field.min}-${field.max}` };
    } else {
      return { valid: false, error: "Invalid format" };
    }
  }
  return { valid: true };
}

function describeCronExpression(parts: string[]): string {
  if (parts.length !== 5) return "Invalid cron expression";

  const [minute, hour, dom, month, dow] = parts;

  const describeField = (val: string, unit: string, names?: string[]): string => {
    if (val === "*") return `every ${unit}`;
    if (val.startsWith("*/")) return `every ${val.slice(2)} ${unit}s`;
    if (names && !val.includes("-") && !val.includes(",")) {
      const idx = parseInt(val);
      return names[idx] || val;
    }
    return val;
  };

  const segments: string[] = [];

  if (minute === "0" && hour === "0" && dom === "1" && month === "1" && dow === "*") {
    return "At midnight on January 1st (yearly)";
  }
  if (minute === "0" && hour === "0" && dom === "1" && month === "*" && dow === "*") {
    return "At midnight on the 1st of every month";
  }
  if (minute === "0" && hour === "0" && dom === "*" && month === "*" && dow !== "*") {
    return `At midnight every ${describeField(dow, "day of week", DAY_NAMES)}`;
  }
  if (minute === "0" && hour === "0" && dom === "*" && month === "*" && dow === "*") {
    return "At midnight every day";
  }

  // Time part
  if (minute !== "*" && hour !== "*" && !minute.includes("/") && !hour.includes("/")) {
    const h = parseInt(hour);
    const m = parseInt(minute);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    segments.push(`At ${displayH}:${m.toString().padStart(2, "0")} ${ampm}`);
  } else {
    if (minute === "*") segments.push("every minute");
    else if (minute.startsWith("*/")) segments.push(`every ${minute.slice(2)} minutes`);
    else segments.push(`at minute ${minute}`);

    if (hour === "*") { /* implied */ }
    else if (hour.startsWith("*/")) segments.push(`every ${hour.slice(2)} hours`);
    else segments.push(`during hour ${hour}`);
  }

  if (dom !== "*") segments.push(`on day ${dom} of the month`);
  if (month !== "*") {
    if (month.startsWith("*/")) segments.push(`every ${month.slice(2)} months`);
    else segments.push(`in ${MONTH_NAMES[parseInt(month)] || `month ${month}`}`);
  }
  if (dow !== "*") {
    const dowParts = dow.split(",").map((d) => {
      const range = d.split("-");
      if (range.length === 2) return `${DAY_NAMES[parseInt(range[0])]}-${DAY_NAMES[parseInt(range[1])]}`;
      return DAY_NAMES[parseInt(d)] || d;
    });
    segments.push(`on ${dowParts.join(", ")}`);
  }

  return segments.join(", ").replace(/^./, (c) => c.toUpperCase());
}

function getNextExecutions(expression: string, count: number): Date[] {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const results: Date[] = [];
  const now = new Date();
  const candidate = new Date(now);
  candidate.setSeconds(0, 0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  const matchField = (val: string, current: number): boolean => {
    if (val === "*") return true;
    if (val.startsWith("*/")) return current % parseInt(val.slice(2)) === 0;
    const parts = val.split(",");
    for (const part of parts) {
      const range = part.split("-");
      if (range.length === 2) {
        const a = parseInt(range[0]);
        const b = parseInt(range[1]);
        if (current >= a && current <= b) return true;
      } else {
        if (parseInt(part) === current) return true;
      }
    }
    return false;
  };

  let iterations = 0;
  while (results.length < count && iterations < 525960) {
    iterations++;
    const min = candidate.getMinutes();
    const hr = candidate.getHours();
    const dom = candidate.getDate();
    const mon = candidate.getMonth() + 1;
    const dow = candidate.getDay();

    if (
      matchField(parts[0], min) &&
      matchField(parts[1], hr) &&
      matchField(parts[2], dom) &&
      matchField(parts[3], mon) &&
      matchField(parts[4], dow)
    ) {
      results.push(new Date(candidate));
    }
    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  return results;
}

export default function CronBuilder() {
  const [fields, setFields] = useState(["*", "*", "*", "*", "*"]);
  const [activeField, setActiveField] = useState<number | null>(null);
  const [expressionInput, setExpressionInput] = useState("* * * * *");
  const [syncFromInput, setSyncFromInput] = useState(false);

  const expression = useMemo(() => fields.join(" "), [fields]);

  const validationErrors = useMemo(() => {
    return fields.map((val, i) => parseCronField(val, FIELDS[i]));
  }, [fields]);

  const isValid = validationErrors.every((v) => v.valid);

  const description = useMemo(
    () => (isValid ? describeCronExpression(fields) : "Invalid expression"),
    [fields, isValid]
  );

  const nextExecutions = useMemo(
    () => (isValid ? getNextExecutions(expression, 5) : []),
    [expression, isValid]
  );

  const updateField = useCallback((index: number, value: string) => {
    setFields((prev) => {
      const next = [...prev];
      next[index] = value;
      setExpressionInput(next.join(" "));
      return next;
    });
  }, []);

  const handleExpressionChange = useCallback((value: string) => {
    setExpressionInput(value);
    const parts = value.trim().split(/\s+/);
    if (parts.length === 5) {
      setFields(parts);
    }
  }, []);

  const applyPreset = useCallback((expr: string) => {
    const parts = expr.split(" ");
    setFields(parts);
    setExpressionInput(expr);
  }, []);

  return (
    <div className="space-y-6">
      {/* Expression Input */}
      <div>
        <label className="text-sm font-medium text-zinc-700 mb-1 block dark:text-zinc-300">
          Cron Expression
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={expressionInput}
            onChange={(e) => handleExpressionChange(e.target.value)}
            className={`flex-1 rounded-xl border px-4 py-3 font-mono text-lg tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-zinc-100 ${
              isValid
                ? "border-zinc-200 dark:border-zinc-700"
                : "border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-950/30"
            }`}
          />
          <CopyButton text={expression} label="Copy" />
        </div>
      </div>

      {/* Human Readable Description */}
      <div
        className={`rounded-xl border px-5 py-3 text-sm ${
          isValid
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
            : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
        }`}
      >
        {description}
      </div>

      {/* Presets */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 mb-2 dark:text-zinc-100">Common Presets</h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.expression)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                expression === preset.expression
                  ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-500"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Builder */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {FIELDS.map((fieldDef, index) => {
          const validation = validationErrors[index];
          return (
            <div
              key={fieldDef.label}
              className={`rounded-xl border p-4 transition-colors cursor-pointer ${
                activeField === index
                  ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-200 dark:bg-blue-950/30 dark:ring-blue-800"
                  : validation.valid
                    ? "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                    : "border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-950/30"
              }`}
              onClick={() => setActiveField(activeField === index ? null : index)}
            >
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 block dark:text-zinc-400">
                {fieldDef.label}
              </label>
              <input
                type="text"
                value={fields[index]}
                onChange={(e) => updateField(index, e.target.value)}
                onFocus={() => setActiveField(index)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-center font-mono text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              {!validation.valid && (
                <p className="text-xs text-red-500 mt-1">{validation.error}</p>
              )}
              {/* Quick selects */}
              <div className="flex flex-wrap gap-1 mt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); updateField(index, "*"); }}
                  className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                  *
                </button>
                {[2, 5, 10, 15].filter((n) => n <= fieldDef.max).map((n) => (
                  <button
                    key={n}
                    onClick={(e) => { e.stopPropagation(); updateField(index, `*/${n}`); }}
                    className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  >
                    */{n}
                  </button>
                ))}
                <button
                  onClick={(e) => { e.stopPropagation(); updateField(index, String(fieldDef.min)); }}
                  className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                  {fieldDef.min}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Executions */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3 dark:text-zinc-100">
          Next 5 Execution Times
        </h3>
        {nextExecutions.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {isValid ? "Calculating..." : "Fix errors to see execution times"}
          </p>
        ) : (
          <ul className="space-y-2">
            {nextExecutions.map((date, i) => (
              <li
                key={i}
                className="flex items-center gap-3 text-sm font-mono text-zinc-700 dark:text-zinc-300"
              >
                <span className="w-5 text-zinc-400 text-right">{i + 1}.</span>
                <span>
                  {date.toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {date.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
