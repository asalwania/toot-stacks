"use client";

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export default function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  showValue = true,
  className = "",
}: RangeSliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between">
          {label && (
            <label className="text-sm font-medium text-gray-300">
              {label}
            </label>
          )}
          {showValue && (
            <span className="rounded-lg bg-white/5 px-2 py-0.5 font-mono text-sm font-medium text-white">
              {value}
            </span>
          )}
        </div>
      )}

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className="range-slider h-2 w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900"
        style={{
          background: `linear-gradient(to right, #6366f1 ${pct}%, rgba(255,255,255,0.08) ${pct}%)`,
        }}
      />

      {/* Min / Max labels */}
      <div className="mt-1 flex justify-between">
        <span className="text-[11px] text-gray-600">{min}</span>
        <span className="text-[11px] text-gray-600">{max}</span>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .range-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #6366f1;
              border: 2px solid #0a0a0f;
              box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
              cursor: pointer;
              transition: transform 0.15s ease, box-shadow 0.15s ease;
            }
            .range-slider::-webkit-slider-thumb:hover {
              transform: scale(1.15);
              box-shadow: 0 0 0 4px rgba(99,102,241,0.3);
            }
            .range-slider::-webkit-slider-thumb:active {
              transform: scale(1.05);
            }
            .range-slider::-moz-range-thumb {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #6366f1;
              border: 2px solid #0a0a0f;
              box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
              cursor: pointer;
              transition: transform 0.15s ease, box-shadow 0.15s ease;
            }
            .range-slider::-moz-range-thumb:hover {
              transform: scale(1.15);
              box-shadow: 0 0 0 4px rgba(99,102,241,0.3);
            }
          `,
        }}
      />
    </div>
  );
}

export { RangeSlider };
export type { RangeSliderProps };
