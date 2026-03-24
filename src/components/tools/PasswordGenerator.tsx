"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { CopyButton } from "@/components/ui/CopyButton";
import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/*  Character sets                                                     */
/* ------------------------------------------------------------------ */

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const DEFAULT_SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

const AMBIGUOUS_CHARS = new Set(["0", "O", "o", "l", "1", "I"]);

/* ------------------------------------------------------------------ */
/*  Strength calculation                                               */
/* ------------------------------------------------------------------ */

interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
  entropy: number;
}

function calculateStrength(password: string, poolSize: number): StrengthResult {
  if (!password) {
    return { score: 0, label: "None", color: "bg-zinc-300 dark:bg-zinc-600", entropy: 0 };
  }

  const entropy = password.length * Math.log2(Math.max(poolSize, 1));

  let score: number;
  let label: string;
  let color: string;

  if (entropy < 28) {
    score = 0;
    label = "Weak";
    color = "bg-red-500";
  } else if (entropy < 36) {
    score = 1;
    label = "Fair";
    color = "bg-orange-500";
  } else if (entropy < 60) {
    score = 2;
    label = "Good";
    color = "bg-yellow-500";
  } else if (entropy < 80) {
    score = 3;
    label = "Strong";
    color = "bg-green-500";
  } else {
    score = 4;
    label = "Very Strong";
    color = "bg-emerald-500";
  }

  return { score, label, color, entropy };
}

/* ------------------------------------------------------------------ */
/*  Password generation                                                */
/* ------------------------------------------------------------------ */

function generatePassword(
  length: number,
  useUpper: boolean,
  useLower: boolean,
  useNumbers: boolean,
  useSymbols: boolean,
  customSymbols: string,
  excludeAmbiguous: boolean
): string {
  let pool = "";
  if (useUpper) pool += UPPERCASE;
  if (useLower) pool += LOWERCASE;
  if (useNumbers) pool += NUMBERS;
  if (useSymbols) pool += customSymbols || DEFAULT_SYMBOLS;

  if (pool.length === 0) pool = LOWERCASE; // fallback

  if (excludeAmbiguous) {
    pool = pool
      .split("")
      .filter((c) => !AMBIGUOUS_CHARS.has(c))
      .join("");
    if (pool.length === 0) pool = "abcdefghjkmnpqrstuvwxyz"; // fallback
  }

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let result = "";
  for (let i = 0; i < length; i++) {
    result += pool[array[i] % pool.length];
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [customSymbols, setCustomSymbols] = useState(DEFAULT_SYMBOLS);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [count, setCount] = useState(1);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [animating, setAnimating] = useState(false);

  /* ---- pool size for entropy ------------------------------------- */

  const poolSize = useMemo(() => {
    let pool = "";
    if (useUppercase) pool += UPPERCASE;
    if (useLowercase) pool += LOWERCASE;
    if (useNumbers) pool += NUMBERS;
    if (useSymbols) pool += customSymbols || DEFAULT_SYMBOLS;
    if (pool.length === 0) pool = LOWERCASE;
    if (excludeAmbiguous) {
      pool = pool
        .split("")
        .filter((c) => !AMBIGUOUS_CHARS.has(c))
        .join("");
    }
    return pool.length;
  }, [useUppercase, useLowercase, useNumbers, useSymbols, customSymbols, excludeAmbiguous]);

  /* ---- generate -------------------------------------------------- */

  const generate = useCallback(() => {
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      results.push(
        generatePassword(
          length,
          useUppercase,
          useLowercase,
          useNumbers,
          useSymbols,
          customSymbols,
          excludeAmbiguous
        )
      );
    }
    setPasswords(results);

    // Add to history (keep last 5 unique, newest first)
    setHistory((prev) => {
      const combined = [...results, ...prev];
      const unique: string[] = [];
      const seen = new Set<string>();
      for (const p of combined) {
        if (!seen.has(p)) {
          seen.add(p);
          unique.push(p);
        }
        if (unique.length >= 5) break;
      }
      return unique;
    });

    // Trigger animation
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
  }, [
    length,
    useUppercase,
    useLowercase,
    useNumbers,
    useSymbols,
    customSymbols,
    excludeAmbiguous,
    count,
  ]);

  /* ---- generate on mount ----------------------------------------- */

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- strength of first password -------------------------------- */

  const strength = passwords.length > 0 ? calculateStrength(passwords[0], poolSize) : null;

  /* ---- checkbox component ---------------------------------------- */

  function Checkbox({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
      </label>
    );
  }

  /* ---- render ---------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 space-y-5">
        {/* Length slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Length
            </label>
            <span className="text-sm font-mono text-zinc-500">{length}</span>
          </div>
          <RangeSlider min={4} max={128} value={length} onChange={setLength} />
        </div>

        {/* Character types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Checkbox
            label="Uppercase (A-Z)"
            checked={useUppercase}
            onChange={setUseUppercase}
          />
          <Checkbox
            label="Lowercase (a-z)"
            checked={useLowercase}
            onChange={setUseLowercase}
          />
          <Checkbox
            label="Numbers (0-9)"
            checked={useNumbers}
            onChange={setUseNumbers}
          />
          <Checkbox
            label="Symbols"
            checked={useSymbols}
            onChange={setUseSymbols}
          />
        </div>

        {/* Custom symbols */}
        {useSymbols && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Custom Symbols
            </label>
            <input
              type="text"
              value={customSymbols}
              onChange={(e) => setCustomSymbols(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Exclude ambiguous */}
        <Checkbox
          label="Exclude ambiguous characters (0, O, o, l, 1, I)"
          checked={excludeAmbiguous}
          onChange={setExcludeAmbiguous}
        />

        {/* Count selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Generate count:
          </label>
          <select
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[1, 2, 3, 5, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Generate button */}
        <Button onClick={generate}>Regenerate</Button>
      </div>

      {/* Generated passwords */}
      {passwords.length > 0 && (
        <div className="space-y-3">
          {passwords.map((pw, idx) => (
            <div
              key={`${pw}-${idx}`}
              className={`rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 transition-all ${
                animating ? "scale-[1.01] opacity-80" : "scale-100 opacity-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <code className="flex-1 text-lg font-mono break-all text-zinc-800 dark:text-zinc-200 select-all">
                  {pw}
                </code>
                <CopyButton text={pw} />
              </div>
            </div>
          ))}

          {/* Strength meter (for first password) */}
          {strength && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Strength
                </span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {strength.label}{" "}
                  <span className="text-xs text-zinc-400">
                    ({strength.entropy.toFixed(0)} bits)
                  </span>
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                  style={{ width: `${Math.min(100, (strength.score + 1) * 20)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Recent History
          </h3>
          <div className="space-y-1">
            {history.map((pw, idx) => (
              <div
                key={`hist-${idx}-${pw.slice(0, 8)}`}
                className="flex items-center gap-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2"
              >
                <code className="flex-1 text-xs font-mono break-all text-zinc-500 dark:text-zinc-400 select-all truncate">
                  {pw}
                </code>
                <CopyButton text={pw} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
