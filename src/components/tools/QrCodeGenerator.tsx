"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { TabSwitcher } from "@/components/ui/TabSwitcher";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

const ERROR_LEVELS: { value: ErrorCorrectionLevel; label: string; description: string }[] = [
  { value: "L", label: "L", description: "Low (~7%)" },
  { value: "M", label: "M", description: "Medium (~15%)" },
  { value: "Q", label: "Q", description: "Quartile (~25%)" },
  { value: "H", label: "H", description: "High (~30%)" },
];

export default function QrCodeGenerator() {
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [text, setText] = useState("https://example.com");
  const [batchText, setBatchText] = useState("");
  const [size, setSize] = useState(300);
  const [errorLevel, setErrorLevel] = useState<ErrorCorrectionLevel>("M");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [margin, setMargin] = useState(4);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [svgString, setSvgString] = useState("");
  const [batchResults, setBatchResults] = useState<{ text: string; dataUrl: string }[]>([]);

  const qrOptions = useMemo(
    () => ({
      errorCorrectionLevel: errorLevel,
      margin,
      width: size,
      color: { dark: fgColor, light: bgColor },
    }),
    [errorLevel, margin, size, fgColor, bgColor]
  );

  // Generate single QR
  useEffect(() => {
    if (mode !== "single" || !text.trim()) return;

    const canvas = canvasRef.current;
    if (canvas) {
      QRCode.toCanvas(canvas, text, qrOptions).catch(() => {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      });
    }

    QRCode.toString(text, { ...qrOptions, type: "svg" })
      .then(setSvgString)
      .catch(() => setSvgString(""));
  }, [text, qrOptions, mode]);

  // Generate batch QR
  useEffect(() => {
    if (mode !== "batch" || !batchText.trim()) {
      setBatchResults([]);
      return;
    }

    const lines = batchText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    Promise.all(
      lines.map(async (line) => {
        try {
          const dataUrl = await QRCode.toDataURL(line, qrOptions);
          return { text: line, dataUrl };
        } catch {
          return { text: line, dataUrl: "" };
        }
      })
    ).then(setBatchResults);
  }, [batchText, qrOptions, mode]);

  const handleDownloadPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  const handleDownloadSvg = useCallback(() => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "qrcode.svg";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [svgString]);

  const handleCopyImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      }
    } catch {
      // Clipboard API may not be available
    }
  }, []);

  const handleBatchDownloadPng = useCallback(
    (dataUrl: string, index: number) => {
      const link = document.createElement("a");
      link.download = `qrcode-${index + 1}.png`;
      link.href = dataUrl;
      link.click();
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <TabSwitcher
        tabs={[
          { id: "single", label: "Single" },
          { id: "batch", label: "Batch" },
        ]}
        activeTab={mode}
        onChange={(id) => setMode(id as "single" | "batch")}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input & Options */}
        <div className="space-y-5">
          {mode === "single" ? (
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1 block dark:text-zinc-300">
                URL or Text
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter URL or text..."
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1 block dark:text-zinc-300">
                URLs / Text (one per line)
              </label>
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={"https://example.com\nhttps://google.com\nHello World"}
                rows={6}
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          )}

          {/* Size */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1 block dark:text-zinc-300">
              Size: {size}px
            </label>
            <RangeSlider min={100} max={1000} step={10} value={size} onChange={setSize} />
          </div>

          {/* Error Correction */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1 block dark:text-zinc-300">
              Error Correction Level
            </label>
            <div className="flex gap-2">
              {ERROR_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setErrorLevel(level.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    errorLevel === level.value
                      ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-500"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                  title={level.description}
                >
                  {level.label}
                  <span className="block text-[10px] text-zinc-400 font-normal dark:text-zinc-500">
                    {level.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1 block dark:text-zinc-300">
                Foreground
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-zinc-200 cursor-pointer bg-transparent p-0.5 dark:border-zinc-700"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1 block dark:text-zinc-300">
                Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-zinc-200 cursor-pointer bg-transparent p-0.5 dark:border-zinc-700"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Margin */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1 block dark:text-zinc-300">
              Margin: {margin} modules
            </label>
            <RangeSlider min={0} max={10} step={1} value={margin} onChange={setMargin} />
          </div>
        </div>

        {/* Right: Preview */}
        <div>
          {mode === "single" ? (
            <div className="flex flex-col items-center gap-4">
              <div
                className="rounded-2xl border border-zinc-200 p-4 inline-flex items-center justify-center dark:border-zinc-700"
                style={{ backgroundColor: bgColor }}
              >
                <canvas ref={canvasRef} />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={handleDownloadPng} variant="primary">
                  Download PNG
                </Button>
                <Button onClick={handleDownloadSvg} variant="secondary">
                  Download SVG
                </Button>
                <Button onClick={handleCopyImage} variant="secondary">
                  Copy to Clipboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {batchResults.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-8">
                  Enter URLs or text, one per line
                </p>
              ) : (
                batchResults.map((result, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {result.dataUrl ? (
                      <img
                        src={result.dataUrl}
                        alt={`QR for ${result.text}`}
                        className="w-20 h-20 rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-red-50 flex items-center justify-center text-red-400 text-xs dark:bg-red-950/30">
                        Error
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-700 truncate dark:text-zinc-300">{result.text}</p>
                    </div>
                    {result.dataUrl && (
                      <Button
                        onClick={() => handleBatchDownloadPng(result.dataUrl, i)}
                        variant="secondary"
                        size="sm"
                      >
                        PNG
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
