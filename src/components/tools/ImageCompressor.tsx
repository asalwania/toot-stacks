"use client";

import { useState, useCallback, useRef } from "react";
import { FileDropZone } from "@/components/ui/FileDropZone";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { DownloadButton } from "@/components/ui/DownloadButton";
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
  error?: string;
  width: number;
  height: number;
}

type OutputFormat = "original" | "image/jpeg" | "image/png" | "image/webp";

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "original", label: "Keep Original" },
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/png", label: "PNG" },
  { value: "image/webp", label: "WebP" },
];

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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ImageCompressor() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState<number | "">("");
  const [maxHeight, setMaxHeight] = useState<number | "">("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("original");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ---- load images from drop ------------------------------------- */

  const handleFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    const entries: ImageEntry[] = imageFiles.map((file) => ({
      id: generateId(),
      file,
      originalSize: file.size,
      originalUrl: URL.createObjectURL(file),
      compressedBlob: null,
      compressedUrl: null,
      compressedSize: null,
      status: "pending" as const,
      width: 0,
      height: 0,
    }));

    // Load natural dimensions
    entries.forEach((entry) => {
      const img = new Image();
      img.onload = () => {
        setImages((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, width: img.naturalWidth, height: img.naturalHeight } : e
          )
        );
      };
      img.src = entry.originalUrl;
    });

    setImages((prev) => [...prev, ...entries]);
  }, []);

  /* ---- compress single image ------------------------------------- */

  const compressImage = useCallback(
    (entry: ImageEntry): Promise<ImageEntry> =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          let w = img.naturalWidth;
          let h = img.naturalHeight;

          // Resize if max dimensions set
          const mw = typeof maxWidth === "number" ? maxWidth : Infinity;
          const mh = typeof maxHeight === "number" ? maxHeight : Infinity;

          if (w > mw || h > mh) {
            const ratio = Math.min(mw / w, mh / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }

          const canvas = canvasRef.current ?? document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({ ...entry, status: "error", error: "Canvas not supported" });
            return;
          }
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          const mime =
            outputFormat === "original" ? entry.file.type : outputFormat;
          const q = mime === "image/png" ? undefined : quality / 100;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve({ ...entry, status: "error", error: "Compression failed" });
                return;
              }
              const url = URL.createObjectURL(blob);
              resolve({
                ...entry,
                compressedBlob: blob,
                compressedUrl: url,
                compressedSize: blob.size,
                status: "done",
                width: w,
                height: h,
              });
            },
            mime,
            q
          );
        };
        img.onerror = () =>
          resolve({ ...entry, status: "error", error: "Failed to load image" });
        img.src = entry.originalUrl;
      }),
    [maxWidth, maxHeight, outputFormat, quality]
  );

  /* ---- compress all ---------------------------------------------- */

  const handleCompressAll = useCallback(async () => {
    const pending = images.filter(
      (e) => e.status === "pending" || e.status === "error"
    );
    if (pending.length === 0) return;

    // Mark as compressing
    setImages((prev) =>
      prev.map((e) =>
        e.status === "pending" || e.status === "error"
          ? { ...e, status: "compressing" as const }
          : e
      )
    );

    for (const entry of pending) {
      const result = await compressImage(entry);
      setImages((prev) => prev.map((e) => (e.id === result.id ? result : e)));
    }
  }, [images, compressImage]);

  /* ---- remove image ---------------------------------------------- */

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

  /* ---- total savings --------------------------------------------- */

  const totalOriginal = images.reduce((s, e) => s + e.originalSize, 0);
  const doneImages = images.filter((e) => e.status === "done");
  const totalCompressed = doneImages.reduce(
    (s, e) => s + (e.compressedSize ?? 0),
    0
  );
  const totalSavings =
    totalOriginal > 0 && doneImages.length > 0
      ? ((1 - totalCompressed / doneImages.reduce((s, e) => s + e.originalSize, 0)) * 100).toFixed(1)
      : null;

  /* ---- render ---------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Drop zone */}
      <FileDropZone
        accept="image/*"
        multiple
        onFiles={handleFiles}
        label="Drop images here or click to upload"
      />

      {/* Controls */}
      {images.length > 0 && (
        <div className="space-y-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
          {/* Quality slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Quality: {quality}%
            </label>
            <RangeSlider
              min={1}
              max={100}
              value={quality}
              onChange={setQuality}
            />
          </div>

          {/* Max dimensions */}
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Max Width (px)
              </label>
              <input
                type="number"
                min={1}
                value={maxWidth}
                onChange={(e) =>
                  setMaxWidth(e.target.value ? parseInt(e.target.value, 10) : "")
                }
                placeholder="No limit"
                className="w-32 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Max Height (px)
              </label>
              <input
                type="number"
                min={1}
                value={maxHeight}
                onChange={(e) =>
                  setMaxHeight(
                    e.target.value ? parseInt(e.target.value, 10) : ""
                  )
                }
                placeholder="No limit"
                className="w-32 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Output format */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Output Format
            </label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FORMAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleCompressAll}>
              Compress{" "}
              {images.filter((e) => e.status === "pending" || e.status === "error")
                .length > 0
                ? `(${images.filter((e) => e.status === "pending" || e.status === "error").length})`
                : "All"}
            </Button>
            {totalSavings !== null && (
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Total savings: {totalSavings}% ({formatBytes(totalOriginal - totalCompressed)} saved)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Image list */}
      {images.length > 0 && (
        <div className="space-y-4">
          {images.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Before */}
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Original
                  </p>
                  <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.originalUrl}
                      alt="Original"
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {entry.file.name} &middot; {formatBytes(entry.originalSize)}
                    {entry.width > 0 && (
                      <span>
                        {" "}
                        &middot; {entry.width}&times;{entry.height}
                      </span>
                    )}
                  </p>
                </div>

                {/* After */}
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Compressed
                  </p>
                  {entry.status === "pending" && (
                    <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-sm text-zinc-400">
                      Waiting...
                    </div>
                  )}
                  {entry.status === "compressing" && (
                    <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-sm text-zinc-400">
                      <span className="animate-pulse">Compressing...</span>
                    </div>
                  )}
                  {entry.status === "error" && (
                    <div className="aspect-video bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-sm text-red-500">
                      {entry.error ?? "Error"}
                    </div>
                  )}
                  {entry.status === "done" && entry.compressedUrl && (
                    <>
                      <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={entry.compressedUrl}
                          alt="Compressed"
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {formatBytes(entry.compressedSize ?? 0)}
                          {entry.compressedSize !== null && (
                            <span
                              className={
                                entry.compressedSize < entry.originalSize
                                  ? "text-green-600 dark:text-green-400 ml-2"
                                  : "text-red-500 ml-2"
                              }
                            >
                              {entry.compressedSize < entry.originalSize
                                ? `-${((1 - entry.compressedSize / entry.originalSize) * 100).toFixed(1)}%`
                                : `+${((entry.compressedSize / entry.originalSize - 1) * 100).toFixed(1)}%`}
                            </span>
                          )}
                        </p>
                        <DownloadButton
                          blob={entry.compressedBlob!}
                          filename={`compressed-${entry.file.name}`}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeImage(entry.id)}
                className="mt-2 text-xs text-zinc-400 hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
