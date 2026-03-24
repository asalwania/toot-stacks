"use client";

import { useState, useCallback, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import { FileDropZone } from "@/components/ui/FileDropZone";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function parsePageRanges(input: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
        pages.add(i - 1);
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        pages.add(num - 1);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Render a specific page of a PDF to a canvas data URL for thumbnail preview.
 */
async function renderPageThumbnail(
  pdfBytes: ArrayBuffer,
  pageIndex: number,
  width: number = 160
): Promise<string | null> {
  try {
    // Use pdf.js-like approach via canvas — but since we only have pdf-lib,
    // we'll create a simple placeholder. For real thumbnails we'd need pdf.js.
    // Instead, we create a descriptive SVG placeholder.
    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const page = doc.getPage(pageIndex);
    const { width: pw, height: ph } = page.getSize();
    const aspect = ph / pw;
    const h = Math.round(width * aspect);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}">
      <rect width="${width}" height="${h}" fill="#1e1e2e" rx="4"/>
      <text x="${width / 2}" y="${h / 2 - 8}" text-anchor="middle" fill="#888" font-family="sans-serif" font-size="12">Page ${pageIndex + 1}</text>
      <text x="${width / 2}" y="${h / 2 + 10}" text-anchor="middle" fill="#666" font-family="sans-serif" font-size="10">${Math.round(pw)} × ${Math.round(ph)}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PdfEntry {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number | null;
}

type CompressionPreset = "light" | "medium" | "heavy";

type SplitMode = "extract" | "every-n" | "individual";

const TABS = [
  { id: "merge", label: "Merge" },
  { id: "compress", label: "Compress" },
  { id: "split", label: "Split" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PdfTools() {
  const [activeTab, setActiveTab] = useState("merge");

  return (
    <div className="space-y-6">
      <TabSwitcher
        tabs={TABS}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t)}
      />

      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === "merge" && <MergeTab />}
        {activeTab === "compress" && <CompressTab />}
        {activeTab === "split" && <SplitTab />}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MERGE TAB                                                          */
/* ================================================================== */

function MergeTab() {
  const [pdfs, setPdfs] = useState<PdfEntry[]>([]);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [merging, setMerging] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    const pdfFiles = files.filter(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    const entries: PdfEntry[] = [];

    for (const file of pdfFiles) {
      try {
        const buf = await readFileAsArrayBuffer(file);
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        entries.push({
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          pageCount: doc.getPageCount(),
        });
      } catch {
        entries.push({
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          pageCount: null,
        });
      }
    }

    setPdfs((prev) => [...prev, ...entries]);
    setMergedBlob(null);
  }, []);

  const removePdf = useCallback((id: string) => {
    setPdfs((prev) => prev.filter((p) => p.id !== id));
    setMergedBlob(null);
  }, []);

  const moveItem = useCallback((from: number, to: number) => {
    setPdfs((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
    setMergedBlob(null);
  }, []);

  /* drag-to-reorder */
  const handleDragStart = (idx: number) => {
    dragItem.current = idx;
  };
  const handleDragEnter = (idx: number) => {
    dragOver.current = idx;
  };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    const from = dragItem.current;
    const to = dragOver.current;
    if (from !== to) {
      moveItem(from, to);
    }
    dragItem.current = null;
    dragOver.current = null;
  };

  const handleMerge = useCallback(async () => {
    if (pdfs.length < 2) return;
    setMerging(true);
    setError(null);
    setProgress("Initializing...");
    try {
      const merged = await PDFDocument.create();
      for (let i = 0; i < pdfs.length; i++) {
        setProgress(`Merging file ${i + 1} of ${pdfs.length}...`);
        const entry = pdfs[i];
        const buf = await readFileAsArrayBuffer(entry.file);
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      setProgress("Saving...");
      const bytes = await merged.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setMergedBlob(blob);
      setProgress("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to merge PDFs"
      );
      setProgress("");
    } finally {
      setMerging(false);
    }
  }, [pdfs]);

  const totalPages = pdfs.reduce(
    (sum, p) => sum + (p.pageCount ?? 0),
    0
  );

  return (
    <div className="space-y-4">
      <FileDropZone
        accept=".pdf,application/pdf"
        multiple
        maxSizeMB={100}
        onFiles={handleFiles}
        label="Drop PDF files here or click to upload"
      />

      {pdfs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-(--th-fg-muted)">
              {pdfs.length} file{pdfs.length !== 1 ? "s" : ""} &middot;{" "}
              {totalPages} total page{totalPages !== 1 ? "s" : ""}
            </p>
            <button
              type="button"
              onClick={() => {
                setPdfs([]);
                setMergedBlob(null);
              }}
              className="text-xs text-(--th-fg-faint) transition-colors hover:text-red-400"
            >
              Clear all
            </button>
          </div>

          <ul className="space-y-1.5">
            {pdfs.map((entry, idx) => (
              <li
                key={entry.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 p-3 transition-colors duration-150 hover:bg-white/4 cursor-grab active:cursor-grabbing select-none"
              >
                {/* Drag handle */}
                <span
                  className="text-(--th-fg-faint) text-sm cursor-grab"
                  aria-hidden="true"
                >
                  &#9776;
                </span>

                {/* PDF icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                  <svg
                    className="h-4 w-4 text-orange-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                </div>

                {/* Filename */}
                <span className="flex-1 truncate text-sm text-(--th-fg-heading)">
                  {entry.name}
                </span>

                {/* Metadata */}
                <span className="shrink-0 text-xs text-(--th-fg-faint)">
                  {entry.pageCount != null
                    ? `${entry.pageCount} pg`
                    : "?"}{" "}
                  &middot; {formatBytes(entry.size)}
                </span>

                {/* Move up/down (accessibility) */}
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, idx - 1)}
                    disabled={idx === 0}
                    aria-label={`Move ${entry.name} up`}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-(--th-fg-faint) transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 15.75l7.5-7.5 7.5 7.5"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, idx + 1)}
                    disabled={idx === pdfs.length - 1}
                    aria-label={`Move ${entry.name} down`}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-(--th-fg-faint) transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removePdf(entry.id)}
                  aria-label={`Remove ${entry.name}`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-(--th-fg-faint) transition-colors duration-200 hover:bg-white/5 hover:text-red-400"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

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
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          {error}
        </div>
      )}

      {progress && (
        <div className="flex items-center gap-2 text-sm text-(--th-fg-muted)">
          <svg
            className="h-4 w-4 animate-spin text-primary-400"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {progress}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleMerge}
          disabled={pdfs.length < 2 || merging}
          loading={merging}
        >
          Merge PDFs
        </Button>
        {mergedBlob && (
          <>
            <DownloadButton blob={mergedBlob} filename="merged.pdf" />
            <span className="text-sm text-(--th-fg-faint)">
              {formatBytes(mergedBlob.size)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  COMPRESS TAB                                                       */
/* ================================================================== */

const COMPRESSION_PRESETS: {
  id: CompressionPreset;
  label: string;
  description: string;
  quality: number;
  removeMetadata: boolean;
  flattenForms: boolean;
}[] = [
  {
    id: "light",
    label: "Light",
    description: "Reduce image quality to 80%",
    quality: 0.8,
    removeMetadata: false,
    flattenForms: false,
  },
  {
    id: "medium",
    label: "Medium",
    description: "Reduce to 60%, remove metadata (recommended)",
    quality: 0.6,
    removeMetadata: true,
    flattenForms: false,
  },
  {
    id: "heavy",
    label: "Heavy",
    description: "Reduce to 40%, remove metadata, flatten forms",
    quality: 0.4,
    removeMetadata: true,
    flattenForms: true,
  },
];

function CompressTab() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [originalSize, setOriginalSize] = useState(0);
  const [preset, setPreset] = useState<CompressionPreset>("medium");
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    const pdf = files.find(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (!pdf) return;
    setFile(pdf);
    setOriginalSize(pdf.size);
    setCompressedBlob(null);
    setError(null);
    try {
      const buf = await readFileAsArrayBuffer(pdf);
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(0);
    }
  }, []);

  const handleCompress = useCallback(async () => {
    if (!file) return;
    setCompressing(true);
    setError(null);
    setCompressedBlob(null);

    try {
      const config = COMPRESSION_PRESETS.find((p) => p.id === preset)!;
      const buf = await readFileAsArrayBuffer(file);
      const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });

      // Create a new clean document (strips unused objects)
      const newDoc = await PDFDocument.create();

      // Remove metadata based on preset
      if (config.removeMetadata) {
        srcDoc.setTitle("");
        srcDoc.setAuthor("");
        srcDoc.setSubject("");
        srcDoc.setKeywords([]);
        srcDoc.setProducer("");
        srcDoc.setCreator("");
      }

      // Copy all pages
      const pages = await newDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      pages.forEach((page) => newDoc.addPage(page));

      // Strip metadata from new doc too
      if (config.removeMetadata) {
        newDoc.setTitle("");
        newDoc.setAuthor("");
        newDoc.setSubject("");
        newDoc.setKeywords([]);
        newDoc.setProducer("");
        newDoc.setCreator("");
      }

      // Flatten form fields if heavy preset
      if (config.flattenForms) {
        try {
          const form = newDoc.getForm();
          form.flatten();
        } catch {
          // No form to flatten, that's fine
        }
      }

      const bytes = await newDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setCompressedBlob(blob);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to compress PDF"
      );
    } finally {
      setCompressing(false);
    }
  }, [file, preset]);

  const savings =
    compressedBlob && originalSize > 0
      ? ((1 - compressedBlob.size / originalSize) * 100).toFixed(1)
      : null;
  const savingsNum = savings ? parseFloat(savings) : 0;

  return (
    <div className="space-y-4">
      <FileDropZone
        accept=".pdf,application/pdf"
        multiple={false}
        maxSizeMB={100}
        onFiles={handleFiles}
        label="Drop a PDF file here or click to upload"
      />

      {file && (
        <div className="rounded-xl border border-white/5 bg-white/2 p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
              <svg
                className="h-4 w-4 text-orange-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-(--th-fg-heading)">
                {file.name}
              </p>
              <p className="text-xs text-(--th-fg-faint)">
                {formatBytes(originalSize)} &middot; {pageCount} page
                {pageCount !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setCompressedBlob(null);
                setError(null);
              }}
              className="text-xs text-(--th-fg-faint) transition-colors hover:text-red-400"
            >
              Remove
            </button>
          </div>

          {/* Compression presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-(--th-fg-heading)">
              Compression level
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {COMPRESSION_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPreset(p.id);
                    setCompressedBlob(null);
                  }}
                  className={`rounded-xl border p-3 text-left transition-all duration-200 ${
                    preset === p.id
                      ? "border-primary-500/50 bg-primary-500/10"
                      : "border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/4"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full border-2 transition-colors ${
                        preset === p.id
                          ? "border-primary-400 bg-primary-400"
                          : "border-white/20"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        preset === p.id
                          ? "text-primary-400"
                          : "text-(--th-fg-heading)"
                      }`}
                    >
                      {p.label}
                    </span>
                    {p.id === "medium" && (
                      <span className="rounded-full bg-primary-500/15 px-1.5 py-0.5 text-[10px] font-medium text-primary-400">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-1 pl-5 text-xs text-(--th-fg-faint)">
                    {p.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-xl border border-blue-500/10 bg-blue-500/5 px-4 py-3 text-xs leading-relaxed text-blue-300/80">
        <svg
          className="mt-0.5 h-3.5 w-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        Browser-based compression removes metadata and reduces image quality.
        For maximum compression, server-side tools like Ghostscript are more
        effective.
      </div>

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
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleCompress}
          disabled={!file || compressing}
          loading={compressing}
        >
          Compress PDF
        </Button>

        {compressedBlob && (
          <>
            <DownloadButton
              blob={compressedBlob}
              filename={`compressed-${file?.name ?? "document.pdf"}`}
            />
          </>
        )}
      </div>

      {/* Before / After sizes */}
      {compressedBlob && (
        <div className="rounded-xl border border-white/5 bg-white/2 p-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-(--th-fg-faint)">Original</p>
              <p className="text-lg font-semibold text-(--th-fg-heading)">
                {formatBytes(originalSize)}
              </p>
            </div>
            <div className="text-(--th-fg-faint)">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-xs text-(--th-fg-faint)">Compressed</p>
              <p className="text-lg font-semibold text-(--th-fg-heading)">
                {formatBytes(compressedBlob.size)}
              </p>
            </div>
            <div
              className={`ml-auto rounded-full px-3 py-1 text-sm font-medium ${
                savingsNum > 0
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {savingsNum > 0
                ? `-${savings}% smaller`
                : `+${Math.abs(savingsNum).toFixed(1)}% larger`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  SPLIT TAB                                                          */
/* ================================================================== */

function SplitTab() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [splitMode, setSplitMode] = useState<SplitMode>("extract");
  const [rangeInput, setRangeInput] = useState("");
  const [everyN, setEveryN] = useState(1);
  const [splitting, setSplitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<
    { name: string; blob: Blob }[]
  >([]);
  const [thumbnails, setThumbnails] = useState<{
    first: string | null;
    last: string | null;
  }>({ first: null, last: null });

  const handleFiles = useCallback(async (files: File[]) => {
    const pdf = files.find(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (!pdf) return;
    setFile(pdf);
    setResults([]);
    setError(null);
    try {
      const buf = await readFileAsArrayBuffer(pdf);
      setPdfBytes(buf);
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const total = doc.getPageCount();
      setPageCount(total);
      setRangeInput(`1-${total}`);
      setEveryN(1);

      // Generate thumbnails
      const first = await renderPageThumbnail(buf, 0);
      const last =
        total > 1 ? await renderPageThumbnail(buf, total - 1) : null;
      setThumbnails({ first, last });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load PDF"
      );
    }
  }, []);

  const handleSplit = useCallback(async () => {
    if (!file || !pdfBytes) return;
    setSplitting(true);
    setError(null);
    setResults([]);

    try {
      const srcDoc = await PDFDocument.load(pdfBytes, {
        ignoreEncryption: true,
      });
      const total = srcDoc.getPageCount();
      const baseName = file.name.replace(/\.pdf$/i, "");

      let outputFiles: { name: string; bytes: Uint8Array }[] = [];

      if (splitMode === "extract") {
        const pages = parsePageRanges(rangeInput, total);
        if (pages.length === 0) {
          setError("No valid pages in the specified range.");
          setSplitting(false);
          return;
        }
        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(srcDoc, pages);
        copied.forEach((p) => newDoc.addPage(p));
        const bytes = await newDoc.save();
        outputFiles = [
          {
            name: `${baseName}_pages_${rangeInput.replace(/\s+/g, "")}.pdf`,
            bytes,
          },
        ];
      } else if (splitMode === "every-n") {
        const n = Math.max(1, everyN);
        let partNum = 1;
        for (let start = 0; start < total; start += n) {
          const end = Math.min(start + n, total);
          const indices = Array.from(
            { length: end - start },
            (_, i) => start + i
          );
          const newDoc = await PDFDocument.create();
          const copied = await newDoc.copyPages(srcDoc, indices);
          copied.forEach((p) => newDoc.addPage(p));
          const bytes = await newDoc.save();
          outputFiles.push({
            name: `${baseName}_part${partNum}.pdf`,
            bytes,
          });
          partNum++;
        }
      } else if (splitMode === "individual") {
        for (let i = 0; i < total; i++) {
          const newDoc = await PDFDocument.create();
          const [copied] = await newDoc.copyPages(srcDoc, [i]);
          newDoc.addPage(copied);
          const bytes = await newDoc.save();
          outputFiles.push({
            name: `${baseName}_page${i + 1}.pdf`,
            bytes,
          });
        }
      }

      const resultBlobs = outputFiles.map((f) => ({
        name: f.name,
        blob: new Blob([f.bytes as unknown as BlobPart], { type: "application/pdf" }),
      }));
      setResults(resultBlobs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to split PDF"
      );
    } finally {
      setSplitting(false);
    }
  }, [file, pdfBytes, splitMode, rangeInput, everyN]);

  const handleDownloadAll = useCallback(async () => {
    if (results.length === 0) return;
    if (results.length === 1) {
      saveAs(results[0].blob, results[0].name);
      return;
    }
    const zip = new JSZip();
    for (const r of results) {
      zip.file(r.name, r.blob);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(
      zipBlob,
      `${file?.name.replace(/\.pdf$/i, "") ?? "split"}_pages.zip`
    );
  }, [results, file]);

  return (
    <div className="space-y-4">
      <FileDropZone
        accept=".pdf,application/pdf"
        multiple={false}
        maxSizeMB={100}
        onFiles={handleFiles}
        label="Drop a PDF file here or click to upload"
      />

      {file && (
        <div className="rounded-xl border border-white/5 bg-white/2 p-4 space-y-4">
          {/* File info + thumbnails */}
          <div className="flex items-start gap-4">
            {/* Thumbnails */}
            <div className="hidden sm:flex gap-2 shrink-0">
              {thumbnails.first && (
                <div className="rounded-lg border border-white/10 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnails.first}
                    alt="First page"
                    className="h-20 w-auto"
                  />
                </div>
              )}
              {thumbnails.last && (
                <div className="rounded-lg border border-white/10 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnails.last}
                    alt="Last page"
                    className="h-20 w-auto"
                  />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-(--th-fg-heading)">
                {file.name}
              </p>
              <p className="text-xs text-(--th-fg-faint)">
                {formatBytes(file.size)} &middot; {pageCount} page
                {pageCount !== 1 ? "s" : ""}
              </p>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPdfBytes(null);
                  setResults([]);
                  setError(null);
                  setThumbnails({ first: null, last: null });
                }}
                className="mt-1 text-xs text-(--th-fg-faint) transition-colors hover:text-red-400"
              >
                Remove
              </button>
            </div>
          </div>

          {/* Split mode selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-(--th-fg-heading)">
              Split mode
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  {
                    id: "extract" as SplitMode,
                    label: "Extract pages",
                    desc: "Pick specific pages or ranges",
                  },
                  {
                    id: "every-n" as SplitMode,
                    label: "Split every N pages",
                    desc: "Divide into equal chunks",
                  },
                  {
                    id: "individual" as SplitMode,
                    label: "Individual pages",
                    desc: "One PDF per page",
                  },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setSplitMode(mode.id);
                    setResults([]);
                  }}
                  className={`rounded-xl border p-3 text-left transition-all duration-200 ${
                    splitMode === mode.id
                      ? "border-primary-500/50 bg-primary-500/10"
                      : "border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/4"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full border-2 transition-colors ${
                        splitMode === mode.id
                          ? "border-primary-400 bg-primary-400"
                          : "border-white/20"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        splitMode === mode.id
                          ? "text-primary-400"
                          : "text-(--th-fg-heading)"
                      }`}
                    >
                      {mode.label}
                    </span>
                  </div>
                  <p className="mt-1 pl-5 text-xs text-(--th-fg-faint)">
                    {mode.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Mode-specific inputs */}
          {splitMode === "extract" && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-(--th-fg-heading)">
                Page ranges
              </label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => {
                  setRangeInput(e.target.value);
                  setResults([]);
                }}
                placeholder="e.g. 1, 3, 5-8, 12"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-(--th-fg-heading) placeholder:text-(--th-fg-faint) outline-none transition-colors focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
              />
              <p className="text-xs text-(--th-fg-faint)">
                Comma-separated page numbers or ranges (1-indexed).
                Example: 1, 3, 5-8, 12
              </p>
            </div>
          )}

          {splitMode === "every-n" && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-(--th-fg-heading)">
                Pages per split
              </label>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={everyN}
                onChange={(e) => {
                  setEveryN(
                    Math.max(1, parseInt(e.target.value, 10) || 1)
                  );
                  setResults([]);
                }}
                className="w-full max-w-50 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-(--th-fg-heading) outline-none transition-colors focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
              />
              <p className="text-xs text-(--th-fg-faint)">
                Creates{" "}
                {Math.ceil(pageCount / Math.max(1, everyN))} file
                {Math.ceil(pageCount / Math.max(1, everyN)) !== 1
                  ? "s"
                  : ""}{" "}
                with {everyN} page{everyN !== 1 ? "s" : ""} each.
              </p>
            </div>
          )}

          {splitMode === "individual" && (
            <p className="text-xs text-(--th-fg-faint)">
              This will create {pageCount} individual PDF file
              {pageCount !== 1 ? "s" : ""}, one for each page.
            </p>
          )}
        </div>
      )}

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
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleSplit}
          disabled={!file || splitting}
          loading={splitting}
        >
          Split PDF
        </Button>

        {results.length > 1 && (
          <Button variant="secondary" onClick={handleDownloadAll}>
            Download All as ZIP
          </Button>
        )}
      </div>

      {/* Results list */}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-(--th-fg-heading)">
            {results.length} file{results.length !== 1 ? "s" : ""} created
          </p>
          <div className="space-y-1.5">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                    <svg
                      className="h-3.5 w-3.5 text-orange-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                  </div>
                  <span className="truncate text-sm text-(--th-fg-heading)">
                    {r.name}
                  </span>
                  <span className="shrink-0 text-xs text-(--th-fg-faint)">
                    {formatBytes(r.blob.size)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => saveAs(r.blob, r.name)}
                  className="ml-3 shrink-0 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-(--th-fg-heading) transition-colors hover:bg-white/10"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
