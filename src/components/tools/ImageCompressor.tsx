"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { FileDropZone } from "@/components/ui/FileDropZone";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ImageEntry {
  id: string;
  file: File;
  originalSize: number;
  originalUrl: string;
  compressedBlob: Blob | null;
  compressedUrl: string | null;
  compressedSize: number | null;
  status: "pending" | "compressing" | "done" | "error";
  progress: number; // 0–100
  error?: string;
  originalWidth: number;
  originalHeight: number;
  /** True when re-encoding produced a larger file, so original was kept */
  keptOriginal?: boolean;
}

type OutputFormat = "original" | "image/jpeg" | "image/webp";

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "original", label: "Same as input" },
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/webp", label: "WebP" },
];

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

function extForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

/**
 * Decide which MIME to actually encode with.
 *
 * Canvas API reality:
 *  - PNG: `quality` param is silently ignored → always lossless → often LARGER
 *    than the original because Canvas's PNG encoder skips advanced optimizations
 *    (pngcrush, zopfli, etc.).
 *  - JPEG / WebP: `quality` works as expected.
 *
 * Strategy: PNG inputs are compressed via WebP so the quality slider actually
 * does something.  This is a *compressor*, not a format converter.
 */
function resolvedMime(file: File, outputFormat: OutputFormat): string {
  if (outputFormat !== "original") return outputFormat;
  // "Same as input" — PNG originals go through WebP for actual compression
  if (file.type === "image/png") return "image/webp";
  return file.type || "image/jpeg";
}

/* ------------------------------------------------------------------ */
/*  Before / After Slider                                              */
/* ------------------------------------------------------------------ */

function BeforeAfterSlider({
  originalUrl,
  compressedUrl,
}: {
  originalUrl: string;
  compressedUrl: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [containerWidth, setContainerWidth] = useState(0);
  const dragging = useRef(false);

  // Track container width with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    setContainerWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full cursor-col-resize select-none overflow-hidden rounded-xl bg-surface-800"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="slider"
      aria-label="Before and after comparison slider"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 2));
        if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + 2));
      }}
    >
      {/* Compressed (bottom layer — full) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={compressedUrl}
        alt="Compressed"
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />

      {/* Original (top layer — clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={originalUrl}
          alt="Original"
          className="absolute inset-0 h-full w-full object-contain"
          style={{ width: containerWidth > 0 ? `${containerWidth}px` : "100%", maxWidth: "none" }}
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 z-10 w-0.5 bg-white/80"
        style={{ left: `${position}%` }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-surface-900/70 backdrop-blur-sm">
          <svg
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 9l4-4 4 4M16 15l-4 4-4-4"
            />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-2 left-2 z-10 rounded-md bg-surface-900/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-sm">
        Original
      </span>
      <span className="absolute top-2 right-2 z-10 rounded-md bg-surface-900/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-sm">
        Compressed
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function ImageCompressor() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [quality, setQuality] = useState(75);
  const [maxWidth, setMaxWidth] = useState<string>("");
  const [maxHeight, setMaxHeight] = useState<string>("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("original");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [dropZoneKey, setDropZoneKey] = useState(0);

  /* ---- cleanup object URLs on unmount ------------------------------ */

  useEffect(() => {
    return () => {
      images.forEach((e) => {
        URL.revokeObjectURL(e.originalUrl);
        if (e.compressedUrl) URL.revokeObjectURL(e.compressedUrl);
      });
    };
    // Only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- reset done images when parameters change -------------------- */

  useEffect(() => {
    setImages((prev) => {
      const hasDone = prev.some((e) => e.status === "done");
      if (!hasDone) return prev;
      return prev.map((e) => {
        if (e.status !== "done") return e;
        // Revoke old compressed URL to prevent memory leaks
        if (e.compressedUrl) URL.revokeObjectURL(e.compressedUrl);
        return {
          ...e,
          status: "pending" as const,
          progress: 0,
          compressedBlob: null,
          compressedUrl: null,
          compressedSize: null,
        };
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, outputFormat, maxWidth, maxHeight]);

  /* ---- handle file upload ------------------------------------------ */

  // Track files we've already processed so FileDropZone removal callbacks
  // (which send the remaining file list) don't create duplicate entries.
  const seenFiles = useRef(new WeakSet<File>());

  const handleFiles = useCallback((files: File[]) => {
    const newFiles = files.filter(
      (f) => f.type.startsWith("image/") && !seenFiles.current.has(f)
    );
    if (newFiles.length === 0) return;

    newFiles.forEach((f) => seenFiles.current.add(f));

    const entries: ImageEntry[] = newFiles.map((file) => ({
      id: generateId(),
      file,
      originalSize: file.size,
      originalUrl: URL.createObjectURL(file),
      compressedBlob: null,
      compressedUrl: null,
      compressedSize: null,
      status: "pending" as const,
      progress: 0,
      originalWidth: 0,
      originalHeight: 0,
    }));

    // Load natural dimensions
    entries.forEach((entry) => {
      const img = new Image();
      img.onload = () => {
        setImages((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? { ...e, originalWidth: img.naturalWidth, originalHeight: img.naturalHeight }
              : e
          )
        );
      };
      img.src = entry.originalUrl;
    });

    setImages((prev) => [...prev, ...entries]);
  }, []);

  /* ---- compress single image --------------------------------------- */

  const compressImage = useCallback(
    (entry: ImageEntry): Promise<ImageEntry> =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            let w = img.naturalWidth;
            let h = img.naturalHeight;

            // Resize if max dimensions set
            const mw = maxWidth ? parseInt(maxWidth, 10) : Infinity;
            const mh = maxHeight ? parseInt(maxHeight, 10) : Infinity;

            if (w > mw || h > mh) {
              const ratio = Math.min(mw / w, mh / h);
              w = Math.round(w * ratio);
              h = Math.round(h * ratio);
            }

            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve({ ...entry, status: "error", error: "Canvas not supported", progress: 0 });
              return;
            }

            const mime = resolvedMime(entry.file, outputFormat);

            // For JPEG, fill white background (no alpha support)
            if (mime === "image/jpeg") {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, w, h);
            } else {
              ctx.clearRect(0, 0, w, h);
            }

            ctx.drawImage(img, 0, 0, w, h);

            // PNG ignores quality param, so we use undefined for it
            const q = mime === "image/png" ? undefined : quality / 100;

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve({ ...entry, status: "error", error: "Compression failed", progress: 0 });
                  return;
                }

                // Revoke previous compressed URL if any
                if (entry.compressedUrl) URL.revokeObjectURL(entry.compressedUrl);

                // If re-encoding made the file BIGGER, keep the original.
                // This happens when the source was already heavily optimized
                // (e.g. JPEG saved at q=50) and we re-encode at a higher quality.
                const useOriginal = blob.size >= entry.originalSize && w === img.naturalWidth && h === img.naturalHeight;
                const finalBlob = useOriginal ? entry.file : blob;
                const url = URL.createObjectURL(finalBlob);

                resolve({
                  ...entry,
                  compressedBlob: finalBlob,
                  compressedUrl: url,
                  compressedSize: finalBlob.size,
                  status: "done",
                  progress: 100,
                  ...(useOriginal ? { keptOriginal: true } : {}),
                });
              },
              mime,
              q
            );
          } catch (err) {
            resolve({
              ...entry,
              status: "error",
              error: (err as Error).message,
              progress: 0,
            });
          }
        };
        img.onerror = () =>
          resolve({ ...entry, status: "error", error: "Failed to load image", progress: 0 });
        img.src = entry.originalUrl;
      }),
    [maxWidth, maxHeight, outputFormat, quality]
  );

  /* ---- compress all ------------------------------------------------ */

  const handleCompressAll = useCallback(async () => {
    const pending = images.filter(
      (e) => e.status === "pending" || e.status === "error"
    );
    if (pending.length === 0) return;

    setIsCompressing(true);

    // Mark all pending as compressing
    setImages((prev) =>
      prev.map((e) =>
        e.status === "pending" || e.status === "error"
          ? { ...e, status: "compressing" as const, progress: 0, compressedBlob: null, compressedUrl: null, compressedSize: null, error: undefined }
          : e
      )
    );

    // Process sequentially to avoid memory issues
    for (let i = 0; i < pending.length; i++) {
      // Update progress to show we're working on this image
      setImages((prev) =>
        prev.map((e) => (e.id === pending[i].id ? { ...e, progress: 50 } : e))
      );

      const result = await compressImage(pending[i]);
      setImages((prev) => prev.map((e) => (e.id === result.id ? result : e)));
    }

    setIsCompressing(false);
  }, [images, compressImage]);

  /* ---- reset ------------------------------------------------------- */

  const handleReset = useCallback(() => {
    images.forEach((e) => {
      URL.revokeObjectURL(e.originalUrl);
      if (e.compressedUrl) URL.revokeObjectURL(e.compressedUrl);
    });
    seenFiles.current = new WeakSet<File>();
    setImages([]);
    setQuality(75);
    setMaxWidth("");
    setMaxHeight("");
    setOutputFormat("original");
    setDropZoneKey((k) => k + 1);
  }, [images]);

  /* ---- remove single image ----------------------------------------- */

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry) {
        URL.revokeObjectURL(entry.originalUrl);
        if (entry.compressedUrl) URL.revokeObjectURL(entry.compressedUrl);
      }
      return prev.filter((e) => e.id !== id);
    });
  }, []);

  /* ---- download single --------------------------------------------- */

  const downloadSingle = useCallback((entry: ImageEntry) => {
    if (!entry.compressedBlob || !entry.compressedUrl) return;
    const a = document.createElement("a");
    a.href = entry.compressedUrl;
    const ext = extForMime(entry.compressedBlob.type);
    const baseName = entry.file.name.replace(/\.[^.]+$/, "");
    a.download = `${baseName}-compressed.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  /* ---- download all as ZIP ----------------------------------------- */

  const downloadAllAsZip = useCallback(async () => {
    const doneEntries = images.filter((e) => e.status === "done" && e.compressedBlob);
    if (doneEntries.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      doneEntries.forEach((entry) => {
        const ext = extForMime(entry.compressedBlob!.type);
        const baseName = entry.file.name.replace(/\.[^.]+$/, "");
        zip.file(`${baseName}-compressed.${ext}`, entry.compressedBlob!);
      });
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "compressed-images.zip");
    } finally {
      setIsZipping(false);
    }
  }, [images]);

  /* ---- computed stats ---------------------------------------------- */

  const doneImages = images.filter((e) => e.status === "done");
  const totalOriginal = doneImages.reduce((s, e) => s + e.originalSize, 0);
  const totalCompressed = doneImages.reduce((s, e) => s + (e.compressedSize ?? 0), 0);
  const totalSavedBytes = totalOriginal - totalCompressed;
  const totalSavedPct = totalOriginal > 0 ? ((totalSavedBytes / totalOriginal) * 100) : 0;
  const pendingCount = images.filter((e) => e.status === "pending" || e.status === "error").length;
  const compressingCount = images.filter((e) => e.status === "compressing").length;

  /* ---- render ------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <FileDropZone
        key={dropZoneKey}
        accept="image/png,image/jpeg,image/webp"
        multiple
        maxSizeMB={50}
        onFiles={handleFiles}
        label="Drop images here or click to browse"
      />

      {/* Thumbnail grid of uploaded images */}
      {images.length > 0 && images.some((e) => e.status === "pending") && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {images
            .filter((e) => e.status === "pending")
            .map((entry) => (
              <div
                key={entry.id}
                className="relative aspect-square overflow-hidden rounded-xl border border-white/5 bg-white/2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.originalUrl}
                  alt={entry.file.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(entry.id)}
                  aria-label={`Remove ${entry.file.name}`}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-900/70 text-white/60 backdrop-blur-sm transition-colors hover:bg-red-500/80 hover:text-white"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Controls bar */}
      {images.length > 0 && (
        <div className="space-y-5 rounded-2xl border border-white/5 bg-white/2 p-5">
          {/* Quality slider */}
          <RangeSlider
            min={10}
            max={100}
            value={quality}
            onChange={setQuality}
            label={`Quality: ${quality}%`}
          />

          {/* Output format */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Output Format
            </label>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setOutputFormat(f.value)}
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                    outputFormat === f.value
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max dimensions */}
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                Max Width (px)
              </label>
              <input
                type="number"
                min={1}
                value={maxWidth}
                onChange={(e) => setMaxWidth(e.target.value)}
                placeholder="No limit"
                className="w-36 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                Max Height (px)
              </label>
              <input
                type="number"
                min={1}
                value={maxHeight}
                onChange={(e) => setMaxHeight(e.target.value)}
                placeholder="No limit"
                className="w-36 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleCompressAll}
              loading={isCompressing}
              disabled={pendingCount === 0 && compressingCount === 0}
            >
              {isCompressing
                ? "Compressing…"
                : `Compress All${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              Reset
            </Button>

            {/* Estimated time for large batches */}
            {pendingCount > 5 && !isCompressing && (
              <span className="text-xs text-gray-600">
                ~{Math.ceil(pendingCount * 0.5)}s estimated
              </span>
            )}
          </div>
        </div>
      )}

      {/* Summary stats bar */}
      {doneImages.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-2xl border border-white/5 bg-white/2 p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Original
            </p>
            <p className="mt-1 text-lg font-bold text-white">
              {formatBytes(totalOriginal)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/2 p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Compressed
            </p>
            <p className="mt-1 text-lg font-bold text-white">
              {formatBytes(totalCompressed)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/2 p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Saved
            </p>
            <p className={`mt-1 text-lg font-bold ${totalSavedPct > 30 ? "text-emerald-400" : "text-white"}`}>
              {totalSavedPct.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/2 p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Reduced by
            </p>
            <p className={`mt-1 text-lg font-bold ${totalSavedPct > 30 ? "text-emerald-400" : "text-white"}`}>
              {formatBytes(Math.abs(totalSavedBytes))}
            </p>
          </div>
        </div>
      )}

      {/* Download All as ZIP */}
      {doneImages.length > 1 && (
        <div className="flex justify-center">
          <Button
            onClick={downloadAllAsZip}
            loading={isZipping}
            size="lg"
            iconLeft={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            }
          >
            {isZipping ? "Creating ZIP…" : `Download All as ZIP (${doneImages.length} files)`}
          </Button>
        </div>
      )}

      {/* Results grid */}
      {images.filter((e) => e.status !== "pending").length > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {images
            .filter((e) => e.status !== "pending")
            .map((entry) => (
              <div
                key={entry.id}
                className="overflow-hidden rounded-2xl border border-white/5 bg-white/2"
              >
                {/* Image comparison or status */}
                {entry.status === "compressing" && (
                  <div className="flex aspect-video items-center justify-center bg-surface-800">
                    <div className="text-center">
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                      <p className="text-sm text-gray-400">Compressing…</p>
                      {/* Progress bar */}
                      <div className="mx-auto mt-3 h-1.5 w-32 sm:w-40 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-primary-500 transition-all duration-500"
                          style={{ width: `${entry.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {entry.status === "error" && (
                  <div className="flex aspect-video items-center justify-center bg-red-500/5">
                    <div className="text-center">
                      <svg className="mx-auto h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      <p className="mt-2 text-sm text-red-400">{entry.error ?? "Error"}</p>
                    </div>
                  </div>
                )}

                {entry.status === "done" && entry.compressedUrl && (
                  <BeforeAfterSlider
                    originalUrl={entry.originalUrl}
                    compressedUrl={entry.compressedUrl}
                  />
                )}

                {/* Card footer */}
                <div className="space-y-3 p-4">
                  {/* File name */}
                  <p className="truncate text-sm font-medium text-gray-300">
                    {entry.file.name}
                  </p>

                  {/* Size comparison */}
                  {entry.status === "done" && entry.compressedSize !== null && (
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="text-gray-500">
                        {formatBytes(entry.originalSize)}
                      </span>
                      <svg className="h-3.5 w-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                      <span className="font-medium text-white">
                        {formatBytes(entry.compressedSize)}
                      </span>

                      {/* Percentage badge */}
                      {(() => {
                        const saved = ((1 - entry.compressedSize / entry.originalSize) * 100);
                        const isGood = saved > 30;
                        return (
                          <span
                            className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
                              saved > 0
                                ? isGood
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-white/5 text-gray-400"
                                : "bg-white/5 text-gray-500"
                            }`}
                          >
                            {saved > 0 ? `-${saved.toFixed(1)}%` : "0%"}
                          </span>
                        );
                      })()}
                      {entry.keptOriginal && (
                        <span className="text-[11px] text-amber-400/70">
                          Already optimized — original kept
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {entry.status === "done" && entry.compressedBlob && (
                      <button
                        type="button"
                        onClick={() => downloadSingle(entry)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-primary-600/20 transition-all duration-200 hover:bg-primary-500"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(entry.id)}
                      className="rounded-xl px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-white/5 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
