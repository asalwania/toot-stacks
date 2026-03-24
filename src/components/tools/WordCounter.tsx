"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";

const STOP_WORDS = new Set([
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see",
  "other", "than", "then", "now", "look", "only", "come", "its", "over",
  "think", "also", "back", "after", "use", "two", "how", "our", "work",
  "first", "well", "way", "even", "new", "want", "because", "any", "these",
  "give", "day", "most", "us", "is", "are", "was", "were", "been", "has",
  "had", "did", "am", "does", "did", "being", "having", "doing",
]);

function analyzeText(text: string) {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;

  const words = text.trim() === "" ? [] : text.trim().split(/\s+/);
  const wordCount = words.length;

  const sentences = text.trim() === ""
    ? 0
    : (text.match(/[.!?]+(\s|$)/g) || []).length || (text.trim().length > 0 ? 1 : 0);

  const paragraphs = text.trim() === ""
    ? 0
    : text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || (text.trim().length > 0 ? 1 : 0);

  const totalWordLength = words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z0-9]/g, "").length, 0);
  const avgWordLength = wordCount > 0 ? (totalWordLength / wordCount).toFixed(1) : "0";

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const speakingTime = Math.max(1, Math.ceil(wordCount / 130));

  // Frequency analysis (excluding stop words)
  const wordFreq = new Map<string, number>();
  for (const word of words) {
    const lower = word.toLowerCase().replace(/[^a-zA-Z0-9'-]/g, "");
    if (lower.length === 0 || STOP_WORDS.has(lower)) continue;
    wordFreq.set(lower, (wordFreq.get(lower) || 0) + 1);
  }
  const topWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Character density
  const charFreq = new Map<string, number>();
  for (const ch of text.toLowerCase()) {
    if (/[a-z]/.test(ch)) {
      charFreq.set(ch, (charFreq.get(ch) || 0) + 1);
    }
  }
  const totalLetters = Array.from(charFreq.values()).reduce((a, b) => a + b, 0);
  const charDensity = Array.from(charFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([ch, count]) => ({
      char: ch,
      count,
      percentage: totalLetters > 0 ? ((count / totalLetters) * 100).toFixed(1) : "0",
    }));

  // Keyword density (top words as % of total)
  const keywordDensity = topWords.map(([word, count]) => ({
    word,
    count,
    density: wordCount > 0 ? ((count / wordCount) * 100).toFixed(2) : "0",
  }));

  return {
    characters,
    charactersNoSpaces,
    wordCount,
    sentences,
    paragraphs,
    avgWordLength,
    readingTime,
    speakingTime,
    topWords,
    charDensity,
    keywordDensity,
  };
}

export default function WordCounter() {
  const [text, setText] = useState("");

  const stats = useMemo(() => analyzeText(text), [text]);

  const statsText = useMemo(() => {
    return [
      `Characters: ${stats.characters}`,
      `Characters (no spaces): ${stats.charactersNoSpaces}`,
      `Words: ${stats.wordCount}`,
      `Sentences: ${stats.sentences}`,
      `Paragraphs: ${stats.paragraphs}`,
      `Avg Word Length: ${stats.avgWordLength}`,
      `Reading Time: ~${stats.readingTime} min`,
      `Speaking Time: ~${stats.speakingTime} min`,
    ].join("\n");
  }, [stats]);

  const handleClear = useCallback(() => setText(""), []);

  return (
    <div className="space-y-6">
      {/* Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type your text here..."
          className="w-full h-56 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <div className="flex gap-2 mt-2">
          <Button onClick={handleClear} variant="secondary">
            Clear
          </Button>
          <CopyButton text={statsText} label="Copy Stats" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Characters", value: stats.characters.toLocaleString() },
          { label: "Chars (no spaces)", value: stats.charactersNoSpaces.toLocaleString() },
          { label: "Words", value: stats.wordCount.toLocaleString() },
          { label: "Sentences", value: stats.sentences.toLocaleString() },
          { label: "Paragraphs", value: stats.paragraphs.toLocaleString() },
          { label: "Avg Word Length", value: stats.avgWordLength },
          { label: "Reading Time", value: `~${stats.readingTime} min` },
          { label: "Speaking Time", value: `~${stats.speakingTime} min` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50"
          >
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
            <p className="text-xl font-semibold text-zinc-900 mt-1 dark:text-zinc-100">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Top Words & Keyword Density */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 10 Frequent Words */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3 dark:text-zinc-100">
            Top 10 Frequent Words
          </h3>
          {stats.topWords.length === 0 ? (
            <p className="text-sm text-zinc-400">No words yet</p>
          ) : (
            <ul className="space-y-2">
              {stats.topWords.map(([word, count], i) => (
                <li key={word} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    <span className="text-zinc-400 mr-2 w-5 inline-block text-right">{i + 1}.</span>
                    {word}
                  </span>
                  <span className="font-mono text-zinc-500 dark:text-zinc-400">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Keyword Density */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3 dark:text-zinc-100">
            Keyword Density
          </h3>
          {stats.keywordDensity.length === 0 ? (
            <p className="text-sm text-zinc-400">No keywords yet</p>
          ) : (
            <ul className="space-y-2">
              {stats.keywordDensity.map(({ word, count, density }) => (
                <li key={word} className="flex items-center gap-3 text-sm">
                  <span className="text-zinc-700 flex-1 dark:text-zinc-300">{word}</span>
                  <span className="text-zinc-500 font-mono text-xs dark:text-zinc-400">{count}x</span>
                  <div className="w-24 bg-zinc-100 rounded-full h-2 dark:bg-zinc-700">
                    <div
                      className="bg-violet-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(parseFloat(density) * 5, 100)}%` }}
                    />
                  </div>
                  <span className="text-zinc-500 font-mono text-xs w-12 text-right dark:text-zinc-400">
                    {density}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Character Density */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3 dark:text-zinc-100">
          Character Density
        </h3>
        {stats.charDensity.length === 0 ? (
          <p className="text-sm text-zinc-400">No characters yet</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 lg:grid-cols-13 gap-2">
            {stats.charDensity.map(({ char, count, percentage }) => (
              <div
                key={char}
                className="flex flex-col items-center rounded-lg bg-zinc-50 px-2 py-2 dark:bg-zinc-800"
              >
                <span className="text-lg font-bold text-violet-600 uppercase dark:text-violet-400">{char}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{count}</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{percentage}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
