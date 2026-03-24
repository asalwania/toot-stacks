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

type OutputFormat =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/bmp"
  | "ico";

interface ImageEntry {
  id: string;
  file: File;
  originalUrl: string;
  originalSize: number;
  originalFormat: string;
  width: number;
  height: number;
  convertedBlob: Blob | null;
  convertedUrl: string | null;
  convertedSize: number | null;
  status: "pending" | "converting" | "done" | "error";
  progress: number;
  error?: string;
}

interface Preset {
  label: string;
  format: OutputFormat;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string }[] = [
  { value: "image/png", label: "PNG", ext: "png" },
  { value: "image/jpeg", label: "JPEG", ext: "jpg" },
  { value: "image/webp", label: "WebP", ext: "webp" },
  { value: "image/bmp", label: "BMP", ext: "bmp" },
  { value: "ico", label: "ICO", ext: "ico" },
];

const ICO_SIZES = [16, 32, 48, 64];

const PRESETS: Preset[] = [
  { label: "PNG \u2192 JPG", format: "image/jpeg" },
  { label: "JPG \u2192 WebP", format: "image/webp" },
  { label: "PNG \u2192 WebP", format: "image/webp" },
  { label: "WebP \u2192 PNG", format: "image/png" },
  { label: "PNG \u2192 ICO", format: "ico" },
];

const ACCEPTED_TYPES =
  "image/png,image/jpeg,image/webp,image/bmp,image/gif,image/svg+xml";

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

function mimeLabel(mime: string): string {
  if (mime === "image/jpeg" || mime === "image/jpg") return "JPG";
  if (mime === "image/png") return "PNG";
  if (mime === "image/webp") return "WebP";
  if (mime === "image/bmp") return "BMP";
  if (mime === "image/gif") return "GIF";
  if (mime === "image/svg+xml") return "SVG";
  return mime.split("/").pop()?.toUpperCase() ?? "?";
}

function extForFormat(fmt: OutputFormat): string {
  return FORMAT_OPTIONS.find((f) => f.value === fmt)?.ext ?? "bin";
}

/* ------------------------------------------------------------------ */
/*  ICO builder — packs multiple PNG images into .ico container        */
/* ------------------------------------------------------------------ */

async function buildIco(img: HTMLImageElement): Promise<Blob> {
  const pngBuffers: ArrayBuffer[] = [];

  for (const size of ICO_SIZES) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!), "image/png"),
    );
    pngBuffers.push(await blob.arrayBuffer());
  }

  const headerSize = 6 + ICO_SIZES.length * 16;
  let totalSize = headerSize;
  for (const buf of pngBuffers) totalSize += buf.byteLength;

  const result = new ArrayBuffer(totalSize);
  const view = new DataView(result);

  // ICONDIR header
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: 1 = ICO
  view.setUint16(4, ICO_SIZES.length, true); // count

  let dataOffset = headerSize;
  for (let i = 0; i < ICO_SIZES.length; i++) {
    const size = ICO_SIZES[i];
    const pngSize = pngBuffers[i].byteLength;
    const entryOffset = 6 + i * 16;

    view.setUint8(entryOffset, size >= 256 ? 0 : size);
    view.setUint8(entryOffset + 1, size >= 256 ? 0 : size);
    view.setUint8(entryOffset + 2, 0); // color palette
    view.setUint8(entryOffset + 3, 0); // reserved
    view.setUint16(entryOffset + 4, 1, true); // color planes
    view.setUint16(entryOffset + 6, 32, true); // bits per pixel
    view.setUint32(entryOffset + 8, pngSize, true); // data size
    view.setUint32(entryOffset + 12, dataOffset, true); // offset

    new Uint8Array(result, dataOffset, pngSize).set(
      new Uint8Array(pngBuffers[i]),
    );
    dataOffset += pngSize;
  }

  return new Blob([result], { type: "image/x-icon" });
}

/* ------------------------------------------------------------------ */
/*  Canvas helpers                                                     */
/* ------------------------------------------------------------------ */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function renderToCanvas(
  img: HTMLImageElement,
  w: number,
  h: number,
  fillWhite: boolean,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  if (fillWhite) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.clearRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      mime,
      quality,
    );
  });
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function ImageConverter() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/png");
  const [quality, setQuality] = useState(90);
  const [enableResize, setEnableResize] = useState(false);
  const [resizeWidth, setResizeWidth] = useState("");
  const [resizeHeight, setResizeHeight] = useState("");
  const [lockAspect, setLockAspect] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [dropZoneKey, setDropZoneKey] = useState(0);

  const aspectRef = useRef<{ w: number; h: number } | null>(null);
  const seenFiles = useRef(new WeakSet<File>());

  const showQuality =
    outputFormat === "image/jpeg" || outputFormat === "image/webp";

  /* ---- cleanup URLs on unmount ------------------------------------- */

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      images.forEach((e) => {
        URL.revokeObjectURL(e.originalUrl);
        if (e.convertedUrl) URL.revokeObjectURL(e.convertedUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- handle file upload ------------------------------------------ */

  const handleFiles = useCallback((files: File[]) => {
    const newFiles = files.filter(
      (f) => f.type.startsWith("image/") && !seenFiles.current.has(f),
    );
    if (newFiles.length === 0) return;
    newFiles.forEach((f) => seenFiles.current.add(f));

    const entries: ImageEntry[] = newFiles.map((file) => ({
      id: generateId(),
      file,
      originalUrl: URL.createObjectURL(file),
      originalSize: file.size,
      originalFormat: file.type,
      width: 0,
      height: 0,
      convertedBlob: null,
      convertedUrl: null,
      convertedSize: null,
      status: "pending" as const,
      progress: 0,
    }));

    // Load natural dimensions
    entries.forEach((entry) => {
      const img = new Image();
      img.onload = () => {
        setImages((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? { ...e, width: img.naturalWidth, height: img.naturalHeight }
              : e,
          ),
        );
      };
      img.src = entry.originalUrl;
    });

    setImages((prev) => [...prev, ...entries]);
  }, []);

  /* ---- aspect ratio reference from first image --------------------- */

  useEffect(() => {
    const first = images.find((e) => e.width > 0 && e.height > 0);
    if (first) {
      aspectRef.current = { w: first.width, h: first.height };
    }
  }, [images]);

  /* ---- resize helpers with aspect lock ----------------------------- */

  const handleResizeWidthChange = useCallback(
    (val: string) => {
      setResizeWidth(val);
      if (lockAspect && aspectRef.current && val) {
        const w = parseInt(val, 10);
        if (!isNaN(w) && aspectRef.current.w > 0) {
          setResizeHeight(
            String(Math.round((w / aspectRef.current.w) * aspectRef.current.h)),
          );
        }
      }
    },
    [lockAspect],
  );

  const handleResizeHeightChange = useCallback(
    (val: string) => {
      setResizeHeight(val);
      if (lockAspect && aspectRef.current && val) {
        const h = parseInt(val, 10);
        if (!isNaN(h) && aspectRef.current.h > 0) {
          setResizeWidth(
            String(Math.round((h / aspectRef.current.h) * aspectRef.current.w)),
          );
        }
      }
    },
    [lockAspect],
  );

  /* ---- convert single image ---------------------------------------- */

  const convertImage = useCallback(
    async (entry: ImageEntry): Promise<ImageEntry> => {
      try {
        const isSvg = entry.file.type === "image/svg+xml";
        const img = await loadImage(entry.originalUrl);

        let w = img.naturalWidth;
        let h = img.naturalHeight;

        // SVG: rasterize at 2x for sharpness
        if (isSvg) {
          w *= 2;
          h *= 2;
        }

        // Resize if enabled
        if (enableResize) {
          const tw = resizeWidth ? parseInt(resizeWidth, 10) : 0;
          const th = resizeHeight ? parseInt(resizeHeight, 10) : 0;
          if (tw > 0 && th > 0) {
            w = tw;
            h = th;
          } else if (tw > 0) {
            h = Math.round((tw / w) * h);
            w = tw;
          } else if (th > 0) {
            w = Math.round((th / h) * w);
            h = th;
          }
        }

        // ICO: generate multi-size .ico
        if (outputFormat === "ico") {
          const blob = await buildIco(img);
          if (entry.convertedUrl) URL.revokeObjectURL(entry.convertedUrl);
          const url = URL.createObjectURL(blob);
          return {
            ...entry,
            convertedBlob: blob,
            convertedUrl: url,
            convertedSize: blob.size,
            status: "done",
            progress: 100,
          };
        }

        // Standard canvas conversion
        const fillWhite =
          outputFormat === "image/jpeg" || outputFormat === "image/bmp";
        const canvas = renderToCanvas(img, w, h, fillWhite);
        const q =
          outputFormat === "image/jpeg" || outputFormat === "image/webp"
            ? quality / 100
            : undefined;
        const blob = await canvasToBlob(canvas, outputFormat, q);

        if (entry.convertedUrl) URL.revokeObjectURL(entry.convertedUrl);
        const url = URL.createObjectURL(blob);

        return {
          ...entry,
          convertedBlob: blob,
          convertedUrl: url,
          convertedSize: blob.size,
          status: "done",
          progress: 100,
        };
      } catch (err) {
        return {
          ...entry,
          status: "error",
          error: (err as Error).message,
          progress: 0,
        };
      }
    },
    [outputFormat, quality, enableResize, resizeWidth, resizeHeight],
  );

  /* ---- convert all ------------------------------------------------- */

  const handleConvertAll = useCallback(async () => {
    const pending = images.filter(
      (e) => e.status === "pending" || e.status === "error",
    );
    if (pending.length === 0) return;

    setIsConverting(true);
    setImages((prev) =>
      prev.map((e) =>
        e.status === "pending" || e.status === "error"
          ? {
              ...e,
              status: "converting" as const,
              progress: 0,
              convertedBlob: null,
              convertedUrl: null,
              convertedSize: null,
              error: undefined,
            }
          : e,
      ),
    );

    for (let i = 0; i < pending.length; i++) {
      setImages((prev) =>
        prev.map((e) => (e.id === pending[i].id ? { ...e, progress: 50 } : e)),
      );
      const result = await convertImage(pending[i]);
      setImages((prev) => prev.map((e) => (e.id === result.id ? result : e)));
    }

    setIsConverting(false);
  }, [images, convertImage]);

  /* ---- remove single image ----------------------------------------- */

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

  /* ---- reset ------------------------------------------------------- */

  const handleReset = useCallback(() => {
    images.forEach((e) => {
      URL.revokeObjectURL(e.originalUrl);
      if (e.convertedUrl) URL.revokeObjectURL(e.convertedUrl);
    });
    seenFiles.current = new WeakSet<File>();
    setImages([]);
    setOutputFormat("image/png");
    setQuality(90);
    setEnableResize(false);
    setResizeWidth("");
    setResizeHeight("");
    setDropZoneKey((k) => k + 1);
  }, [images]);

  /* ---- download single --------------------------------------------- */

  const downloadSingle = useCallback(
    (entry: ImageEntry) => {
      if (!entry.convertedBlob || !entry.convertedUrl) return;
      const a = document.createElement("a");
      a.href = entry.convertedUrl;
      const baseName = entry.file.name.replace(/\.[^.]+$/, "");
      a.download = `${baseName}.${extForFormat(outputFormat)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    [outputFormat],
  );

  /* ---- download all as ZIP ----------------------------------------- */

  const downloadAllAsZip = useCallback(async () => {
    const done = images.filter((e) => e.status === "done" && e.convertedBlob);
    if (done.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      done.forEach((entry) => {
        const baseName = entry.file.name.replace(/\.[^.]+$/, "");
        zip.file(
          `${baseName}.${extForFormat(outputFormat)}`,
          entry.convertedBlob!,
        );
      });
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "converted-images.zip");
    } finally {
      setIsZipping(false);
    }
  }, [images, outputFormat]);

  /* ---- computed ----------------------------------------------------- */

  const doneImages = images.filter((e) => e.status === "done");
  const pendingCount = images.filter(
    (e) => e.status === "pending" || e.status === "error",
  ).length;

  /* ---- render ------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <FileDropZone
        key={dropZoneKey}
        accept={ACCEPTED_TYPES}
        multiple
        maxSizeMB={50}
        onFiles={handleFiles}
        label="Drop images here or click to browse"
      />

      {/* Quick convert presets */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-x-visible">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setOutputFormat(preset.format)}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
              outputFormat === preset.format
                ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Thumbnail grid of pending uploads */}
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
                {/* Format badge */}
                <span className="absolute bottom-1 left-1 rounded-md bg-surface-900/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white/80 backdrop-blur-sm">
                  {mimeLabel(entry.originalFormat)}
                </span>
                <button
                  type="button"
                  onClick={() => removeImage(entry.id)}
                  aria-label={`Remove ${entry.file.name}`}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-900/70 text-white/60 backdrop-blur-sm transition-colors hover:bg-red-500/80 hover:text-white"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Conversion controls */}
      {images.length > 0 && (
        <div className="space-y-5 rounded-2xl border border-white/5 bg-white/2 p-5">
          {/* Output format */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Convert to
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
                  {f.value === "ico" && (
                    <span className="ml-1 text-[10px] text-white/50">
                      16-64px
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quality slider (JPEG / WebP only) */}
          {showQuality && (
            <RangeSlider
              min={10}
              max={100}
              value={quality}
              onChange={setQuality}
              label={`Quality: ${quality}%`}
            />
          )}

          {/* Resize option */}
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 text-sm font-medium text-gray-300">
              <input
                type="checkbox"
                checked={enableResize}
                onChange={(e) => setEnableResize(e.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary-600 focus:ring-primary-500"
              />
              Resize images
            </label>

            {enableResize && (
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={resizeWidth}
                    onChange={(e) => handleResizeWidthChange(e.target.value)}
                    placeholder="Auto"
                    className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                {/* Lock aspect ratio toggle */}
                <button
                  type="button"
                  onClick={() => setLockAspect(!lockAspect)}
                  className={`mb-0.5 flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    lockAspect
                      ? "bg-primary-600/20 text-primary-400"
                      : "bg-white/5 text-gray-600"
                  }`}
                  title={
                    lockAspect ? "Aspect ratio locked" : "Aspect ratio unlocked"
                  }
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    {lockAspect ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                      />
                    )}
                  </svg>
                </button>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={resizeHeight}
                    onChange={(e) => handleResizeHeightChange(e.target.value)}
                    placeholder="Auto"
                    className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleConvertAll}
              loading={isConverting}
              disabled={pendingCount === 0 && !isConverting}
            >
              {isConverting
                ? "Converting\u2026"
                : `Convert All${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              Reset
            </Button>
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
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            }
          >
            {isZipping
              ? "Creating ZIP\u2026"
              : `Download All as ZIP (${doneImages.length} files)`}
          </Button>
        </div>
      )}

      {/* Results list */}
      {images.filter((e) => e.status !== "pending").length > 0 && (
        <div className="space-y-3">
          {images
            .filter((e) => e.status !== "pending")
            .map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/5 bg-white/2 p-4 sm:flex-row sm:items-center"
              >
                {/* Preview thumbnail */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/5 bg-surface-800">
                  {entry.status === "converting" ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                    </div>
                  ) : entry.status === "error" ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg
                        className="h-5 w-5 text-red-400"
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
                    </div>
                  ) : entry.convertedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.convertedUrl}
                      alt={entry.file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-medium text-gray-300">
                    {entry.file.name}
                  </p>

                  {entry.status === "converting" && (
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all duration-500"
                        style={{ width: `${entry.progress}%` }}
                      />
                    </div>
                  )}

                  {entry.status === "error" && (
                    <p className="text-xs text-red-400">
                      {entry.error ?? "Conversion failed"}
                    </p>
                  )}

                  {entry.status === "done" && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {/* Format badges */}
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs font-semibold text-gray-400">
                        {mimeLabel(entry.originalFormat)}
                      </span>
                      <svg
                        className="h-3 w-3 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                      <span className="rounded-md bg-primary-500/10 px-2 py-0.5 text-xs font-semibold text-primary-400">
                        {outputFormat === "ico"
                          ? "ICO"
                          : mimeLabel(outputFormat)}
                      </span>

                      {/* Size info */}
                      <span className="text-xs text-gray-500">
                        {formatBytes(entry.originalSize)}
                      </span>
                      <svg
                        className="h-3 w-3 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                      <span className="text-xs font-medium text-white">
                        {formatBytes(entry.convertedSize ?? 0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  {entry.status === "done" && entry.convertedBlob && (
                    <button
                      type="button"
                      onClick={() => downloadSingle(entry)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-primary-600/20 transition-all duration-200 hover:bg-primary-500"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
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
            ))}
        </div>
      )}

      {/* Convert More button */}
      {doneImages.length > 0 && !isConverting && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => {
              seenFiles.current = new WeakSet<File>();
              setDropZoneKey((k) => k + 1);
              setImages((prev) => prev.filter((e) => e.status !== "done"));
            }}
          >
            Convert More
          </Button>
        </div>
      )}
    </div>
  );
}
