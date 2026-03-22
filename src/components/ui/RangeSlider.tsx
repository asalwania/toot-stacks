"use client";

interface RangeSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  showValue?: boolean;
  step?: number;
  className?: string;
}

export { RangeSlider };

export default function RangeSlider({
  min,
  max,
  value,
  onChange,
  label,
  showValue = true,
  step = 1,
  className = "",
}: RangeSliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between">
          {label && (
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {label}
            </label>
          )}
          {showValue && (
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-sm font-mono font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              {value}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="range-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 outline-none dark:bg-zinc-700"
          style={{
            background: `linear-gradient(to right, #2563eb ${percent}%, ${
              "var(--range-track, #e4e4e7)"
            } ${percent}%)`,
          }}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
      </div>

      {/* Min/Max labels */}
      <div className="mt-1 flex justify-between">
        <span className="text-xs text-zinc-400 dark:text-zinc-500">{min}</span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">{max}</span>
      </div>

      {/* Custom thumb styling via global styles */}
      <style jsx>{`
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #2563eb;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.4);
        }
        .range-slider::-webkit-slider-thumb:active {
          transform: scale(1.05);
        }
        .range-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #2563eb;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .range-slider::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.4);
        }
        .range-slider:focus-visible::-webkit-slider-thumb {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
