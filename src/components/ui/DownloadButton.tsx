"use client";

import { useCallback, type ReactNode } from "react";

interface DownloadButtonProps {
  content?: string | Blob;
  blob?: Blob;
  filename: string;
  mimeType?: string;
  className?: string;
  children?: ReactNode;
}

export { DownloadButton };

export default function DownloadButton({
  content,
  blob: blobProp,
  filename,
  mimeType = "application/octet-stream",
  className = "",
  children,
}: DownloadButtonProps) {
  const handleDownload = useCallback(() => {
    const source = blobProp ?? content;
    if (!source) return;
    const blob =
      source instanceof Blob ? source : new Blob([source], { type: mimeType });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [blobProp, content, filename, mimeType]);

  return (
    <button
      onClick={handleDownload}
      className={`inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:bg-blue-800 dark:focus-visible:ring-offset-zinc-900 ${className}`}
    >
      <svg
        className="h-4 w-4"
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
      {children ?? "Download"}
    </button>
  );
}
