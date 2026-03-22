"use client";

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";

interface FileDropZoneProps {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export { FileDropZone };

export default function FileDropZone({
  accept,
  maxSize,
  multiple = false,
  onFiles,
  label = "Drop files here or click to browse",
}: FileDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback(
    (files: File[]): File[] | null => {
      setError(null);

      if (!multiple && files.length > 1) {
        setError("Only one file is allowed.");
        return null;
      }

      if (accept) {
        const acceptedTypes = accept.split(",").map((t) => t.trim().toLowerCase());
        for (const file of files) {
          const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
          const mimeMatch = acceptedTypes.some(
            (t) =>
              t === file.type.toLowerCase() ||
              t === ext ||
              (t.endsWith("/*") && file.type.toLowerCase().startsWith(t.replace("/*", "/")))
          );
          if (!mimeMatch) {
            setError(`File type "${ext}" is not accepted. Accepted: ${accept}`);
            return null;
          }
        }
      }

      if (maxSize) {
        for (const file of files) {
          if (file.size > maxSize) {
            setError(
              `File "${file.name}" (${formatBytes(file.size)}) exceeds the maximum size of ${formatBytes(maxSize)}.`
            );
            return null;
          }
        }
      }

      return files;
    },
    [accept, maxSize, multiple]
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      const validated = validateFiles(files);
      if (validated) {
        onFiles(validated);
      }
    },
    [onFiles, validateFiles]
  );

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-all ${
          dragOver
            ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
            : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
        }`}
      >
        {/* Upload icon */}
        <svg
          className={`mb-3 h-10 w-10 ${
            dragOver ? "text-blue-500 dark:text-blue-400" : "text-zinc-400 dark:text-zinc-500"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>

        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>

        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {accept && <span>Accepted: {accept}</span>}
          {accept && maxSize && <span> &middot; </span>}
          {maxSize && <span>Max: {formatBytes(maxSize)}</span>}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
          aria-label="File input"
        />
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
