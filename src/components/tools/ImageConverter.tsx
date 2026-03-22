"use client";

import { useState, useCallback, useRef } from "react";
import { FileDropZone } from "@/components/ui/FileDropZone";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TargetFormat = "image/png" | "image/jpeg" | "image/webp" | "image/bmp" | "image/x-icon";

interface ImageEntry {
  id: string;
  file: File;
  originalUrl: string;
  originalSize: number;
  sourceFormat: string;
  convertedBlob: Blob | null;
  convertedUrl: string | null;
  convertedSize: number | null;
  status: "pending" | "converting" | "done" | "error";
  error?: string;
}

const TARGET_FORMATS: { value: TargetFormat; label: string; ext: string }[] = [
  { value: "image/png", label: "PNG", ext: "png" },
  { value: "image/jpeg", label: "JPEG", ext: "jpg" },
  { value: "image/webp", label: "WebP", ext: "webp" },
  { value: "image/bmp", label: "BMP", ext: "bmp" },
  { value: "image/x-icon", label: "ICO", ext: "ico" },
];

const ICO_SIZES = [16, 32, 48, 64, 128, 256];

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

function detectFormat(file: File): string {
  const map: Record<string, string> = {
    "image/png": "PNG",
    "image/jpeg": "JPEG",
    "image/webp": "WebP",
    "image/bmp": "BMP",
    "image/gif": "GIF",
    "image/svg+xml": "SVG",
    "image/x-icon": "ICO",
    "image/vnd.microsoft.icon": "ICO",
    "image/tiff": "TIFF",
    "image/avif": "AVIF",
  };
  return map[file.type] ?? file.type.split("/")[1]?.toUpperCase() ?? "Unknown";
}

function getExtForMime(mime: string): string {
  return TARGET_FORMATS.find((f) => f.value === mime)?.ext ?? "bin";
}

/* ------------------------------------------------------------------ */
/*  ICO builder                                                        */
/*  Packs multiple PNG images into a single .ico container             */
/* ------------------------------------------------------------------ */

async function buildIco(
  img: HTMLImageElement,
  selectedSize: number
): Promise<Blob> {
  const sizes = ICO_SIZES.filter((s) => s <= selectedSize);
  if (sizes.length === 0) sizes.push(16);

  const pngBuffers: ArrayBuffer[] = [];

  for (const size of sizes) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, size, size);
    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!), "image/png")
    );
    pngBuffers.push(await blob.arrayBuffer());
  }

  // ICO header: 6 bytes + 16 bytes per image entry
  const headerSize = 6 + sizes.length * 16;
  let totalSize = headerSize;
  for (const buf of pngBuffers) totalSize += buf.byteLength;

  const result = new ArrayBuffer(totalSize);
  const view = new DataView(result);

  // ICONDIR
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: 1 = ICO
  view.setUint16(4, sizes.length, true); // count

  let dataOffset = headerSize;
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const pngSize = pngBuffers[i].byteLength;
    const entryOffset = 6 + i * 16;

    view.setUint8(entryOffset, size < 256 ? size : 0); // width
    view.setUint8(entryOffset + 1, size < 256 ? size : 0); // height
    view.setUint8(entryOffset + 2, 0); // color palette
    view.setUint8(entryOffset + 3, 0); // reserved
    view.setUint16(entryOffset + 4, 1, true); // color planes
    view.setUint16(entryOffset + 6, 32, true); // bits per pixel
    view.setUint32(entryOffset + 8, pngSize, true); // size of data
    view.setUint32(entryOffset + 12, dataOffset, true); // offset

    const src = new Uint8Array(pngBuffers[i]);
    const dst = new Uint8Array(result, dataOffset, pngSize);
    dst.set(src);
    dataOffset += pngSize;
  }

  return new Blob([result], { type: "image/x-icon" });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ImageConverter() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("image/png");
  const [quality, setQuality] = useState(90);
  const [icoSize, setIcoSize] = useState(256);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isLossy = targetFormat === "image/jpeg" || targetFormat === "image/webp";
  const isIco = targetFormat === "image/x-icon";

  /* ---- handle files ---------------------------------------------- */

  const handleFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    const entries: ImageEntry[] = imageFiles.map((file) => ({
      id: generateId(),
      file,
      originalUrl: URL.createObjectURL(file),
      originalSize: file.size,
      sourceFormat: detectFormat(file),
      convertedBlob: null,
      convertedUrl: null,
      convertedSize: null,
      status: "pending" as const,
    }));
    setImages((prev) => [...prev, ...entries]);
  }, []);

  /* ---- convert single -------------------------------------------- */

  const convertImage = useCallback(
    (entry: ImageEntry): Promise<ImageEntry> =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = async () => {
          try {
            if (isIco) {
              const blob = await buildIco(img, icoSize);
              const url = URL.createObjectURL(blob);
              resolve({
                ...entry,
                convertedBlob: blob,
                convertedUrl: url,
                convertedSize: blob.size,
                status: "done",
              });
              return;
            }

            const canvas =
              canvasRef.current ?? document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve({
                ...entry,
                status: "error",
                error: "Canvas not supported",
              });
              return;
            }

            // For JPEG, fill white background (no alpha support)
            if (targetFormat === "image/jpeg") {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            const q = isLossy ? quality / 100 : undefined;

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve({
                    ...entry,
                    status: "error",
                    error: "Conversion failed",
                  });
                  return;
                }
                const url = URL.createObjectURL(blob);
                resolve({
                  ...entry,
                  convertedBlob: blob,
                  convertedUrl: url,
                  convertedSize: blob.size,
                  status: "done",
                });
              },
              targetFormat,
              q
            );
          } catch (err) {
            resolve({
              ...entry,
              status: "error",
              error: (err as Error).message,
            });
          }
        };
        img.onerror = () =>
          resolve({
            ...entry,
            status: "error",
            error: "Failed to load image",
          });
        img.src = entry.originalUrl;
      }),
    [targetFormat, quality, isLossy, isIco, icoSize]
  );

  /* ---- convert all ----------------------------------------------- */

  const handleConvertAll = useCallback(async () => {
    const pending = images.filter(
      (e) => e.status === "pending" || e.status === "error"
    );
    if (pending.length === 0) return;

    setImages((prev) =>
      prev.map((e) =>
        e.status === "pending" || e.status === "error"
          ? { ...e, status: "converting" as const, convertedBlob: null, convertedUrl: null, convertedSize: null }
          : e
      )
    );

    for (const entry of pending) {
      const result = await convertImage(entry);
      setImages((prev) => prev.map((e) => (e.id === result.id ? result : e)));
    }
  }, [images, convertImage]);

  /* ---- remove ---------------------------------------------------- */

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry) {
        URL.revokeObjectURL(entry.originalUrl);
        if (entry.convertedUrl) URL.revokeObjectURL(entry.convertedUrl);
      }
      return prev.filter((e) => e.id !== id);
    });
  }, []);

  /* ---- filename for download ------------------------------------- */

  function outputFilename(entry: ImageEntry): string {
    const baseName = entry.file.name.replace(/\.[^.]+$/, "");
    return `${baseName}.${getExtForMime(targetFormat)}`;
  }

  /* ---- render ---------------------------------------------------- */

  return (
    <div className="space-y-6">
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
          {/* Target format */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Target Format
            </label>
            <div className="flex flex-wrap gap-2">
              {TARGET_FORMATS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setTargetFormat(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    targetFormat === f.value
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality slider (lossy only) */}
          {isLossy && (
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
          )}

          {/* ICO size selector */}
          {isIco && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Max ICO Size
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                All standard sizes up to selected value will be included.
              </p>
              <div className="flex flex-wrap gap-2">
                {ICO_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setIcoSize(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      icoSize === s
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {s}px
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleConvertAll}>
            Convert{" "}
            {images.filter((e) => e.status === "pending" || e.status === "error")
              .length > 0
              ? `(${images.filter((e) => e.status === "pending" || e.status === "error").length})`
              : "All"}
          </Button>
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
                {/* Original preview */}
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Original ({entry.sourceFormat})
                  </p>
                  <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.originalUrl}
                      alt="Original"
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {entry.file.name} &middot; {formatBytes(entry.originalSize)}
                  </p>
                </div>

                {/* Converted preview */}
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Converted ({TARGET_FORMATS.find((f) => f.value === targetFormat)?.label})
                  </p>

                  {entry.status === "pending" && (
                    <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-sm text-zinc-400">
                      Waiting...
                    </div>
                  )}
                  {entry.status === "converting" && (
                    <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-sm text-zinc-400">
                      <span className="animate-pulse">Converting...</span>
                    </div>
                  )}
                  {entry.status === "error" && (
                    <div className="aspect-video bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-sm text-red-500">
                      {entry.error ?? "Error"}
                    </div>
                  )}
                  {entry.status === "done" && entry.convertedUrl && (
                    <>
                      <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={entry.convertedUrl}
                          alt="Converted"
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {formatBytes(entry.convertedSize ?? 0)}
                          {entry.convertedSize !== null && (
                            <span className="ml-2 text-zinc-500">
                              (was {formatBytes(entry.originalSize)})
                            </span>
                          )}
                        </p>
                        <DownloadButton
                          blob={entry.convertedBlob!}
                          filename={outputFilename(entry)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

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
