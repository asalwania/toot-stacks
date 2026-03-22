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

/**
 * Parse page range string like "1-3, 5, 7-10" into array of 0-based page indices.
 */
function parsePageRanges(input: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);

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

const TABS = ["Merge", "Split", "Compress"] as const;
type Tab = (typeof TABS)[number];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PdfTools() {
  const [activeTab, setActiveTab] = useState<Tab>("Merge");

  return (
    <div className="space-y-6">
      <TabSwitcher
        tabs={TABS as unknown as string[]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as Tab)}
      />

      {activeTab === "Merge" && <MergeTab />}
      {activeTab === "Split" && <SplitTab />}
      {activeTab === "Compress" && <CompressTab />}
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
  const [error, setError] = useState<string | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    const pdfFiles = files.filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
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
    if (from === to) return;
    setPdfs((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
    dragItem.current = null;
    dragOver.current = null;
    setMergedBlob(null);
  };

  const handleMerge = useCallback(async () => {
    if (pdfs.length < 2) return;
    setMerging(true);
    setError(null);
    try {
      const merged = await PDFDocument.create();
      for (const entry of pdfs) {
        const buf = await readFileAsArrayBuffer(entry.file);
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      const bytes = await merged.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setMergedBlob(blob);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setMerging(false);
    }
  }, [pdfs]);

  return (
    <div className="space-y-4">
      <FileDropZone
        accept=".pdf,application/pdf"
        multiple
        onFiles={handleFiles}
        label="Drop PDF files here or click to upload"
      />

      {pdfs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Drag to reorder. {pdfs.length} file{pdfs.length !== 1 ? "s" : ""} selected.
          </p>
          <ul className="space-y-1">
            {pdfs.map((entry, idx) => (
              <li
                key={entry.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 cursor-grab active:cursor-grabbing select-none"
              >
                <span className="text-zinc-400 text-sm">&#9776;</span>
                <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate">
                  {entry.name}
                </span>
                <span className="text-xs text-zinc-400">
                  {entry.pageCount != null ? `${entry.pageCount} pg` : "?"} &middot;{" "}
                  {formatBytes(entry.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removePdf(entry.id)}
                  className="text-xs text-zinc-400 hover:text-red-500"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleMerge} disabled={pdfs.length < 2 || merging}>
          {merging ? "Merging..." : "Merge PDFs"}
        </Button>
        {mergedBlob && (
          <DownloadButton blob={mergedBlob} filename="merged.pdf" />
        )}
        {mergedBlob && (
          <span className="text-sm text-zinc-500">
            {formatBytes(mergedBlob.size)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SPLIT TAB                                                          */
/* ================================================================== */

function SplitTab() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rangeInput, setRangeInput] = useState("");
  const [splitting, setSplitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState("split.pdf");

  const handleFiles = useCallback(async (files: File[]) => {
    const pdf = files.find(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (!pdf) return;
    setFile(pdf);
    setResultBlob(null);
    setError(null);
    try {
      const buf = await readFileAsArrayBuffer(pdf);
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
      setRangeInput(`1-${doc.getPageCount()}`);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const handleSplit = useCallback(async () => {
    if (!file || !rangeInput.trim()) return;
    setSplitting(true);
    setError(null);
    setResultBlob(null);

    try {
      const buf = await readFileAsArrayBuffer(file);
      const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const total = srcDoc.getPageCount();

      // Split input into separate range groups by semicolons for multi-doc, or treat as one group
      const groups = rangeInput
        .split(";")
        .map((g) => g.trim())
        .filter(Boolean);

      if (groups.length <= 1) {
        // Single output PDF
        const pages = parsePageRanges(rangeInput, total);
        if (pages.length === 0) {
          setError("No valid pages in range");
          setSplitting(false);
          return;
        }
        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(srcDoc, pages);
        copied.forEach((p) => newDoc.addPage(p));
        const bytes = await newDoc.save();
        const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
        setResultBlob(blob);
        setResultName(
          `${file.name.replace(/\.pdf$/i, "")}_pages_${rangeInput.replace(/\s+/g, "")}.pdf`
        );
      } else {
        // Multiple outputs -> zip
        const zip = new JSZip();
        for (let i = 0; i < groups.length; i++) {
          const pages = parsePageRanges(groups[i], total);
          if (pages.length === 0) continue;
          const newDoc = await PDFDocument.create();
          const copied = await newDoc.copyPages(srcDoc, pages);
          copied.forEach((p) => newDoc.addPage(p));
          const bytes = await newDoc.save();
          zip.file(
            `${file.name.replace(/\.pdf$/i, "")}_part${i + 1}.pdf`,
            bytes
          );
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        setResultBlob(zipBlob);
        setResultName(
          `${file.name.replace(/\.pdf$/i, "")}_split.zip`
        );
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSplitting(false);
    }
  }, [file, rangeInput]);

  return (
    <div className="space-y-4">
      <FileDropZone
        accept=".pdf,application/pdf"
        multiple={false}
        onFiles={handleFiles}
        label="Drop a PDF file here or click to upload"
      />

      {file && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 space-y-3">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-medium">{file.name}</span> &middot;{" "}
            {formatBytes(file.size)} &middot; {pageCount} pages
          </p>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Page ranges
            </label>
            <input
              type="text"
              value={rangeInput}
              onChange={(e) => {
                setRangeInput(e.target.value);
                setResultBlob(null);
              }}
              placeholder="e.g. 1-3, 5, 7-10 (use ; for multiple PDFs)"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-zinc-400">
              Comma-separated pages/ranges for one file. Use semicolons to create multiple PDFs (downloaded as ZIP).
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleSplit} disabled={!file || splitting}>
          {splitting ? "Splitting..." : "Split PDF"}
        </Button>
        {resultBlob && (
          <DownloadButton blob={resultBlob} filename={resultName} />
        )}
        {resultBlob && (
          <span className="text-sm text-zinc-500">
            {formatBytes(resultBlob.size)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  COMPRESS TAB                                                       */
/* ================================================================== */

function CompressTab() {
  const [file, setFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    const pdf = files.find(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (!pdf) return;
    setFile(pdf);
    setOriginalSize(pdf.size);
    setCompressedBlob(null);
    setError(null);
  }, []);

  const handleCompress = useCallback(async () => {
    if (!file) return;
    setCompressing(true);
    setError(null);
    setCompressedBlob(null);

    try {
      const buf = await readFileAsArrayBuffer(file);
      const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });

      // Create a new clean document (strips metadata, unused objects)
      const newDoc = await PDFDocument.create();

      // Remove metadata from source
      srcDoc.setTitle("");
      srcDoc.setAuthor("");
      srcDoc.setSubject("");
      srcDoc.setKeywords([]);
      srcDoc.setProducer("");
      srcDoc.setCreator("");

      // Copy all pages
      const pages = await newDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      pages.forEach((page) => newDoc.addPage(page));

      // Strip metadata from new doc too
      newDoc.setTitle("");
      newDoc.setAuthor("");
      newDoc.setSubject("");
      newDoc.setKeywords([]);
      newDoc.setProducer("");
      newDoc.setCreator("");

      const bytes = await newDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setCompressedBlob(blob);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCompressing(false);
    }
  }, [file]);

  const savings =
    compressedBlob && originalSize > 0
      ? ((1 - compressedBlob.size / originalSize) * 100).toFixed(1)
      : null;

  return (
    <div className="space-y-4">
      <FileDropZone
        accept=".pdf,application/pdf"
        multiple={false}
        onFiles={handleFiles}
        label="Drop a PDF file here or click to upload"
      />

      {file && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-medium">{file.name}</span> &middot;{" "}
            {formatBytes(originalSize)}
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleCompress} disabled={!file || compressing}>
          {compressing ? "Compressing..." : "Compress PDF"}
        </Button>

        {compressedBlob && (
          <>
            <DownloadButton
              blob={compressedBlob}
              filename={`compressed-${file?.name ?? "document.pdf"}`}
            />
            <span className="text-sm text-zinc-500">
              {formatBytes(compressedBlob.size)}
              {savings !== null && (
                <span
                  className={
                    parseFloat(savings) > 0
                      ? "text-green-600 dark:text-green-400 ml-2"
                      : "text-zinc-400 ml-2"
                  }
                >
                  {parseFloat(savings) > 0
                    ? `-${savings}%`
                    : `+${Math.abs(parseFloat(savings)).toFixed(1)}%`}
                </span>
              )}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
