"use client";

import {
  useState,
  useRef,
  useCallback,
  type DragEvent,
  type ChangeEvent,
} from "react";

interface FileDropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  maxSize?: number;
  label?: string;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function FileDropZone({
  onFiles,
  accept,
  multiple = false,
  maxSizeMB,
  maxSize,
  label = "Drop files here or click to browse",
  className = "",
}: FileDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolvedMaxMB = maxSizeMB ?? (maxSize ? maxSize / (1024 * 1024) : 0);
  const maxSizeBytes = maxSize ?? (maxSizeMB ? maxSizeMB * 1024 * 1024 : 0);

  const validate = useCallback(
    (files: File[]): File[] | null => {
      setError(null);

      if (!multiple && files.length > 1) {
        setError("Only one file is allowed.");
        return null;
      }

      if (accept) {
        const accepted = accept
          .split(",")
          .map((t) => t.trim().toLowerCase());

        for (const file of files) {
          const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
          const match = accepted.some(
            (a) =>
              a === file.type.toLowerCase() ||
              a === ext ||
              (a.endsWith("/*") &&
                file.type.toLowerCase().startsWith(a.replace("/*", "/")))
          );
          if (!match) {
            setError(
              `"${file.name}" is not an accepted file type. Accepted: ${accept}`
            );
            return null;
          }
        }
      }

      for (const file of files) {
        if (file.size > maxSizeBytes) {
          setError(
            `"${file.name}" (${formatBytes(file.size)}) exceeds the ${resolvedMaxMB.toFixed(0)} MB limit.`
          );
          return null;
        }
      }

      return files;
    },
    [accept, maxSizeBytes, maxSizeMB, multiple]
  );

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      const valid = validate(files);
      if (valid) {
        setSelectedFiles(valid);
        onFiles(valid);
      }
    },
    [onFiles, validate]
  );

  const removeFile = useCallback(
    (index: number) => {
      setSelectedFiles((prev) => {
        const next = prev.filter((_, i) => i !== index);
        onFiles(next);
        return next;
      });
    },
    [onFiles]
  );

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    processFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={className}>
      {/* Drop area */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
          dragOver
            ? "border-primary-500 bg-primary-500/5"
            : "border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/4"
        }`}
      >
        {/* Animated upload icon */}
        <div className={`mb-4 transition-transform duration-200 ${dragOver ? "-translate-y-1" : ""}`}>
          <svg
            className={`h-10 w-10 transition-colors duration-200 ${
              dragOver ? "text-primary-400" : "text-gray-600"
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
        </div>

        <p className="mb-1 text-sm font-medium text-gray-300">{label}</p>

        <p className="text-xs text-gray-600">
          {accept && (
            <span>
              Accepts:{" "}
              {accept
                .split(",")
                .map((a) => a.trim())
                .join(", ")}
            </span>
          )}
          {accept && resolvedMaxMB > 0 && <span> · </span>}
          {resolvedMaxMB > 0 && <span>Max {resolvedMaxMB.toFixed(0)} MB per file</span>}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          className="hidden"
          aria-label="File input"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
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

      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {selectedFiles.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 px-4 py-3"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <svg
                  className="h-4 w-4 shrink-0 text-gray-500"
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
                <span className="truncate text-sm text-gray-300">
                  {file.name}
                </span>
                <span className="shrink-0 text-xs text-gray-600">
                  {formatBytes(file.size)}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                aria-label={`Remove ${file.name}`}
                className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-600 transition-colors duration-200 hover:bg-white/5 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { FileDropZone };
export type { FileDropZoneProps };
