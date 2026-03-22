"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface TabObject {
  id: string;
  label: string;
}

type TabInput = TabObject | string;

interface TabSwitcherProps {
  tabs: TabInput[];
  activeTab: string;
  onTabChange?: (tabId: string) => void;
  onChange?: (tabId: string) => void;
}

function normalizeTab(tab: TabInput): TabObject {
  if (typeof tab === "string") {
    return { id: tab, label: tab };
  }
  return tab;
}

export { TabSwitcher };

export default function TabSwitcher({
  tabs: rawTabs,
  activeTab,
  onTabChange,
  onChange,
}: TabSwitcherProps) {
  const tabs = rawTabs.map(normalizeTab);
  const handleChange = onTabChange ?? onChange ?? (() => {});

  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const activeEl = tabRefs.current.get(activeTab);
    const container = containerRef.current;
    if (activeEl && container) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeEl.getBoundingClientRect();
      setIndicator({
        left: tabRect.left - containerRect.left + container.scrollLeft,
        width: tabRect.width,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    let nextIndex = currentIndex;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    const nextTab = tabs[nextIndex];
    handleChange(nextTab.id);
    tabRefs.current.get(nextTab.id)?.focus();
  }

  return (
    <div
      ref={containerRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className="relative flex overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800"
    >
      {/* Animated indicator */}
      <div
        className="absolute top-1 h-[calc(100%-8px)] rounded-md bg-white shadow-sm transition-all duration-200 ease-out dark:bg-zinc-700"
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
          className={`relative z-10 shrink-0 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "text-zinc-900 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
