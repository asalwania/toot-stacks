"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";

interface ColorStop {
  id: string;
  color: string;
  position: number;
}

interface GradientLayer {
  id: string;
  type: "linear" | "radial" | "conic";
  angle: number;
  stops: ColorStop[];
}

const PRESETS: { name: string; layers: GradientLayer[] }[] = [
  {
    name: "Sunset",
    layers: [{
      id: "p1", type: "linear", angle: 135,
      stops: [
        { id: "s1", color: "#f97316", position: 0 },
        { id: "s2", color: "#ec4899", position: 50 },
        { id: "s3", color: "#8b5cf6", position: 100 },
      ],
    }],
  },
  {
    name: "Ocean",
    layers: [{
      id: "p2", type: "linear", angle: 180,
      stops: [
        { id: "s1", color: "#0ea5e9", position: 0 },
        { id: "s2", color: "#2dd4bf", position: 100 },
      ],
    }],
  },
  {
    name: "Aurora",
    layers: [{
      id: "p3", type: "linear", angle: 135,
      stops: [
        { id: "s1", color: "#a855f7", position: 0 },
        { id: "s2", color: "#6366f1", position: 33 },
        { id: "s3", color: "#06b6d4", position: 66 },
        { id: "s4", color: "#34d399", position: 100 },
      ],
    }],
  },
  {
    name: "Peach",
    layers: [{
      id: "p4", type: "linear", angle: 90,
      stops: [
        { id: "s1", color: "#fda4af", position: 0 },
        { id: "s2", color: "#fdba74", position: 100 },
      ],
    }],
  },
  {
    name: "Midnight",
    layers: [{
      id: "p5", type: "linear", angle: 135,
      stops: [
        { id: "s1", color: "#0f172a", position: 0 },
        { id: "s2", color: "#1e3a5f", position: 50 },
        { id: "s3", color: "#312e81", position: 100 },
      ],
    }],
  },
  {
    name: "Forest",
    layers: [{
      id: "p6", type: "linear", angle: 160,
      stops: [
        { id: "s1", color: "#065f46", position: 0 },
        { id: "s2", color: "#22c55e", position: 50 },
        { id: "s3", color: "#a3e635", position: 100 },
      ],
    }],
  },
  {
    name: "Fire",
    layers: [{
      id: "p7", type: "radial", angle: 0,
      stops: [
        { id: "s1", color: "#fbbf24", position: 0 },
        { id: "s2", color: "#f97316", position: 40 },
        { id: "s3", color: "#dc2626", position: 100 },
      ],
    }],
  },
  {
    name: "Candy",
    layers: [{
      id: "p8", type: "conic", angle: 0,
      stops: [
        { id: "s1", color: "#f472b6", position: 0 },
        { id: "s2", color: "#c084fc", position: 25 },
        { id: "s3", color: "#60a5fa", position: 50 },
        { id: "s4", color: "#34d399", position: 75 },
        { id: "s5", color: "#f472b6", position: 100 },
      ],
    }],
  },
  {
    name: "Neon",
    layers: [{
      id: "p9", type: "linear", angle: 45,
      stops: [
        { id: "s1", color: "#00ff87", position: 0 },
        { id: "s2", color: "#60efff", position: 100 },
      ],
    }],
  },
  {
    name: "Royal",
    layers: [{
      id: "p10", type: "linear", angle: 135,
      stops: [
        { id: "s1", color: "#667eea", position: 0 },
        { id: "s2", color: "#764ba2", position: 100 },
      ],
    }],
  },
];

let stopIdCounter = 100;
let layerIdCounter = 100;

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${++stopIdCounter}`;
}

function buildGradientCss(layer: GradientLayer): string {
  const stopsStr = layer.stops
    .map((s) => `${s.color} ${s.position}%`)
    .join(", ");
  switch (layer.type) {
    case "linear":
      return `linear-gradient(${layer.angle}deg, ${stopsStr})`;
    case "radial":
      return `radial-gradient(circle, ${stopsStr})`;
    case "conic":
      return `conic-gradient(from ${layer.angle}deg, ${stopsStr})`;
  }
}

function randomColor(): string {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
}

export default function CssGradient() {
  const [layers, setLayers] = useState<GradientLayer[]>([
    {
      id: "default",
      type: "linear",
      angle: 135,
      stops: [
        { id: "d1", color: "#6366f1", position: 0 },
        { id: "d2", color: "#ec4899", position: 100 },
      ],
    },
  ]);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);

  const activeLayer = layers[activeLayerIndex] || layers[0];

  const fullGradientCss = useMemo(
    () => layers.map(buildGradientCss).join(", "),
    [layers]
  );

  const cssOutput = useMemo(() => {
    const val = fullGradientCss;
    return [
      `background: ${layers[0].stops[0].color};`,
      `-webkit-background: ${val};`,
      `-moz-background: ${val};`,
      `background: ${val};`,
    ].join("\n");
  }, [fullGradientCss, layers]);

  const updateActiveLayer = useCallback(
    (updater: (layer: GradientLayer) => GradientLayer) => {
      setLayers((prev) =>
        prev.map((l, i) => (i === activeLayerIndex ? updater(l) : l))
      );
    },
    [activeLayerIndex]
  );

  const addStop = useCallback(() => {
    updateActiveLayer((layer) => ({
      ...layer,
      stops: [
        ...layer.stops,
        {
          id: generateId("stop"),
          color: randomColor(),
          position: 50,
        },
      ],
    }));
  }, [updateActiveLayer]);

  const removeStop = useCallback(
    (stopId: string) => {
      updateActiveLayer((layer) => ({
        ...layer,
        stops: layer.stops.length > 2 ? layer.stops.filter((s) => s.id !== stopId) : layer.stops,
      }));
    },
    [updateActiveLayer]
  );

  const updateStop = useCallback(
    (stopId: string, updates: Partial<ColorStop>) => {
      updateActiveLayer((layer) => ({
        ...layer,
        stops: layer.stops.map((s) => (s.id === stopId ? { ...s, ...updates } : s)),
      }));
    },
    [updateActiveLayer]
  );

  const moveStop = useCallback(
    (index: number, direction: -1 | 1) => {
      updateActiveLayer((layer) => {
        const newStops = [...layer.stops];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newStops.length) return layer;
        [newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]];
        return { ...layer, stops: newStops };
      });
    },
    [updateActiveLayer]
  );

  const addLayer = useCallback(() => {
    const newLayer: GradientLayer = {
      id: generateId("layer"),
      type: "linear",
      angle: 45,
      stops: [
        { id: generateId("stop"), color: randomColor(), position: 0 },
        { id: generateId("stop"), color: randomColor(), position: 100 },
      ],
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerIndex(layers.length);
  }, [layers.length]);

  const removeLayer = useCallback(
    (index: number) => {
      if (layers.length <= 1) return;
      setLayers((prev) => prev.filter((_, i) => i !== index));
      setActiveLayerIndex((prev) => Math.min(prev, layers.length - 2));
    },
    [layers.length]
  );

  const applyPreset = useCallback((preset: typeof PRESETS[number]) => {
    setLayers(
      preset.layers.map((l) => ({
        ...l,
        id: generateId("layer"),
        stops: l.stops.map((s) => ({ ...s, id: generateId("stop") })),
      }))
    );
    setActiveLayerIndex(0);
  }, []);

  const handleRandom = useCallback(() => {
    const types: GradientLayer["type"][] = ["linear", "radial", "conic"];
    const type = types[Math.floor(Math.random() * types.length)];
    const numStops = 2 + Math.floor(Math.random() * 3);
    const stops: ColorStop[] = [];
    for (let i = 0; i < numStops; i++) {
      stops.push({
        id: generateId("stop"),
        color: randomColor(),
        position: Math.round((i / (numStops - 1)) * 100),
      });
    }
    setLayers([
      {
        id: generateId("layer"),
        type,
        angle: Math.floor(Math.random() * 360),
        stops,
      },
    ]);
    setActiveLayerIndex(0);
  }, []);

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div
        className="w-full h-64 rounded-2xl border border-zinc-200 shadow-inner dark:border-zinc-700"
        style={{ background: fullGradientCss }}
      />

      {/* Presets */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 mb-2 dark:text-zinc-100">Presets</h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="group relative w-10 h-10 rounded-lg border border-zinc-200 overflow-hidden transition-transform hover:scale-110 dark:border-zinc-600"
              title={preset.name}
              style={{ background: buildGradientCss(preset.layers[0]) }}
            >
              <span className="sr-only">{preset.name}</span>
            </button>
          ))}
          <Button onClick={handleRandom} variant="secondary" size="sm">
            Random
          </Button>
        </div>
      </div>

      {/* Layers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Layers</h3>
          <Button onClick={addLayer} variant="secondary" size="sm">
            + Add Layer
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {layers.map((layer, i) => (
            <div key={layer.id} className="flex items-center gap-1">
              <button
                onClick={() => setActiveLayerIndex(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  i === activeLayerIndex
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-500"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                Layer {i + 1}
              </button>
              {layers.length > 1 && (
                <button
                  onClick={() => removeLayer(i)}
                  className="text-zinc-400 hover:text-red-500 text-xs px-1"
                  title="Remove layer"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Layer Controls */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-5 dark:border-zinc-700 dark:bg-zinc-900">
        {/* Gradient Type */}
        <div>
          <label className="text-sm font-medium text-zinc-700 mb-1 block dark:text-zinc-300">Type</label>
          <div className="flex gap-2">
            {(["linear", "radial", "conic"] as const).map((t) => (
              <button
                key={t}
                onClick={() => updateActiveLayer((l) => ({ ...l, type: t }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium border capitalize transition-colors ${
                  activeLayer.type === t
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Angle (for linear and conic) */}
        {(activeLayer.type === "linear" || activeLayer.type === "conic") && (
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1 block dark:text-zinc-300">
              Angle: {activeLayer.angle}deg
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={360}
                value={activeLayer.angle}
                onChange={(e) =>
                  updateActiveLayer((l) => ({ ...l, angle: parseInt(e.target.value) }))
                }
                className="flex-1 accent-blue-500"
              />
              {/* Visual dial */}
              <div
                className="w-12 h-12 rounded-full border-2 border-zinc-300 relative flex-shrink-0 dark:border-zinc-600"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const cx = rect.left + rect.width / 2;
                  const cy = rect.top + rect.height / 2;
                  const angle = Math.round(
                    (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90 + 360
                  ) % 360;
                  updateActiveLayer((l) => ({ ...l, angle }));
                }}
              >
                <div
                  className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-blue-500 origin-bottom rounded-full"
                  style={{
                    transform: `translate(-50%, -100%) rotate(${activeLayer.angle}deg)`,
                  }}
                />
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2" />
              </div>
              <input
                type="number"
                min={0}
                max={360}
                value={activeLayer.angle}
                onChange={(e) =>
                  updateActiveLayer((l) => ({
                    ...l,
                    angle: Math.max(0, Math.min(360, parseInt(e.target.value) || 0)),
                  }))
                }
                className="w-20 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-center dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        )}

        {/* Color Stops */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Color Stops</label>
            <Button onClick={addStop} variant="secondary" size="sm">
              + Add Stop
            </Button>
          </div>
          <div className="space-y-2">
            {activeLayer.stops.map((stop, index) => (
              <div key={stop.id} className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveStop(index, -1)}
                    disabled={index === 0}
                    className="text-zinc-400 hover:text-zinc-600 disabled:opacity-30 text-xs leading-none dark:hover:text-zinc-300"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveStop(index, 1)}
                    disabled={index === activeLayer.stops.length - 1}
                    className="text-zinc-400 hover:text-zinc-600 disabled:opacity-30 text-xs leading-none dark:hover:text-zinc-300"
                  >
                    ▼
                  </button>
                </div>
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-zinc-200 cursor-pointer bg-transparent p-0.5 dark:border-zinc-700"
                />
                <input
                  type="text"
                  value={stop.color}
                  onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                  className="w-24 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={stop.position}
                  onChange={(e) => updateStop(stop.id, { position: parseInt(e.target.value) })}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-xs text-zinc-500 w-10 text-right font-mono dark:text-zinc-400">
                  {stop.position}%
                </span>
                <button
                  onClick={() => removeStop(stop.id)}
                  disabled={activeLayer.stops.length <= 2}
                  className="text-zinc-400 hover:text-red-500 disabled:opacity-30 text-sm px-1"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS Output */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-950 p-5 dark:border-zinc-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-100">CSS Code</h3>
          <CopyButton text={cssOutput} label="Copy CSS" />
        </div>
        <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap break-all">
          {cssOutput}
        </pre>
      </div>
    </div>
  );
}
