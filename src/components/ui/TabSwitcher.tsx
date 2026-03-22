"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Tab {
  id: string;
  label: string;
}

type TabInput = Tab | string;

interface TabSwitcherProps {
  tabs: TabInput[];
  activeTab: string;
  onChange?: (id: string) => void;
  onTabChange?: (id: string) => void;
  className?: string;
}

function normalize(t: TabInput): Tab {
  return typeof t === "string" ? { id: t, label: t } : t;
}

export default function TabSwitcher({
  tabs: rawTabs,
  activeTab,
  onChange,
  onTabChange,
  className = "",
}: TabSwitcherProps) {
  const tabs = rawTabs.map(normalize);
  const handleChange = onChange ?? onTabChange ?? (() => {});
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const el = tabRefs.current.get(activeTab);
    const container = containerRef.current;
    if (el && container) {
      const cr = container.getBoundingClientRect();
      const tr = el.getBoundingClientRect();
      setIndicator({
        left: tr.left - cr.left + container.scrollLeft,
        width: tr.width,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const idx = tabs.findIndex((t) => t.id === activeTab);
    let next = idx;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      next = (idx + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      next = (idx - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      next = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      next = tabs.length - 1;
    } else {
      return;
    }

    handleChange(tabs[next].id);
    tabRefs.current.get(tabs[next].id)?.focus();
  }

  return (
    <div
      ref={containerRef}
      role="tablist"
      onKeyDown={onKeyDown}
      className={`relative inline-flex overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1 ${className}`}
    >
      {/* Sliding active indicator */}
      <div
        className="absolute top-1 h-[calc(100%-8px)] rounded-lg bg-white/10 transition-all duration-200 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
        aria-hidden="true"
      />

      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => {
            if (el) tabRefs.current.set(tab.id, el);
          }}
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onClick={() => handleChange(tab.id)}
          className={`relative z-10 shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
            activeTab === tab.id
              ? "text-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export { TabSwitcher };
export type { TabSwitcherProps, Tab };
