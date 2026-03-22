"use client";

import { useEffect, useRef } from "react";

interface AdSlotProps {
  variant: "leaderboard" | "banner" | "rectangle" | "inline";
  className?: string;
  showLabel?: boolean;
}

const DIMENSIONS: Record<
  AdSlotProps["variant"],
  { width: number | "auto"; height: number | "auto"; label: string }
> = {
  leaderboard: { width: 728, height: 90, label: "728×90" },
  banner: { width: 468, height: 60, label: "468×60" },
  rectangle: { width: 300, height: 250, label: "300×250" },
  inline: { width: "auto", height: "auto", label: "Responsive" },
};

const isDev = process.env.NODE_ENV === "development";

function AdSlotInner({
  variant,
  className = "",
  showLabel = true,
}: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const { width, height, label } = DIMENSIONS[variant];

  useEffect(() => {
    if (isDev || !adRef.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
        {}
      );
    } catch {
      // AdSense not loaded
    }
  }, []);

  if (isDev) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/2 ${className}`}
        style={{
          width: width === "auto" ? "100%" : `${width}px`,
          height: height === "auto" ? "auto" : `${height}px`,
          minHeight: height === "auto" ? "90px" : undefined,
          maxWidth: "100%",
        }}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-medium uppercase tracking-widest text-white/20">
            Ad Placeholder
          </span>
          <span className="font-mono text-[10px] text-white/10">{label}</span>
        </div>
        {showLabel && (
          <span className="absolute right-2 top-1 text-[9px] text-white/10">
            Advertisement
          </span>
        )}
      </div>
    );
  }

  return (
    <div ref={adRef} className={`relative ${className}`}>
      {showLabel && (
        <span className="mb-0.5 block text-center text-[9px] text-white/20">
          Advertisement
        </span>
      )}
      {variant === "inline" ? (
        <ins
          className="adsbygoogle block"
          data-ad-client="ca-pub-XXXXXXXXXX"
          data-ad-slot=""
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <ins
          className="adsbygoogle block"
          data-ad-client="ca-pub-XXXXXXXXXX"
          data-ad-slot=""
          style={{
            width: width === "auto" ? "100%" : `${width}px`,
            height: height === "auto" ? undefined : `${height}px`,
            maxWidth: "100%",
          }}
        />
      )}
    </div>
  );
}

export default AdSlotInner;
export { AdSlotInner as AdSlot };
export type { AdSlotProps };
