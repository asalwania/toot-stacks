"use client";

import { useCallback, type ReactNode } from "react";

interface DownloadButtonProps {
  data?: Blob | string;
  blob?: Blob;
  content?: string | Blob;
  filename: string;
  mimeType?: string;
  label?: string;
  className?: string;
  children?: ReactNode;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function DownloadButton({
  data,
  blob: blobProp,
  content,
  filename,
  mimeType = "application/octet-stream",
  label,
  className = "",
  children,
}: DownloadButtonProps) {
  const source = data ?? blobProp ?? content;
  const sizeLabel =
    source instanceof Blob ? formatBytes(source.size) : null;

  const handleDownload = useCallback(() => {
    if (!source) return;
    const blob =
      source instanceof Blob
        ? source
        : new Blob([source], { type: mimeType });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [source, filename, mimeType]);

  return (
    <button
      onClick={handleDownload}
      className={`group inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary-600/20 transition-all duration-200 hover:bg-primary-500 hover:shadow-primary-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900 active:bg-primary-700 ${className}`}
    >
      {/* Download icon with hover animation */}
      <svg
        className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
      </svg>
      <span>{children ?? label ?? "Download"}</span>
      {sizeLabel && (
        <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[11px] font-normal">
          {sizeLabel}
        </span>
      )}
    </button>
  );
}

export { DownloadButton };
export type { DownloadButtonProps };
