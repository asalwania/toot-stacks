"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { tools } from "@/lib/tools-registry";

export default function Header() {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  /* ---- dark mode persistence ---- */
  useEffect(() => {
    const stored = localStorage.getItem("devtoolkit-theme");
    if (stored === "light") {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      document.documentElement.classList.toggle("light", !next);
      localStorage.setItem("devtoolkit-theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  /* ---- close dropdown on outside click ---- */
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setToolsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  /* ---- close mobile menu on route change ---- */
  useEffect(() => {
    setMobileOpen(false);
    setToolsOpen(false);
  }, [pathname]);

  /* ---- lock body scroll when mobile menu is open ---- */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className="sticky top-0 z-50 w-full backdrop-blur-xl"
      style={{
        borderBottom: "1px solid var(--th-border)",
        backgroundColor: "var(--th-header-bg)",
      }}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ---- Left: Logo ---- */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black/60"
        >
          <Image
            src="/logo.svg"
            alt="ToolsStack Logo"
            width={32}
            height={32}
            className="rounded-lg transition-shadow duration-200 group-hover:shadow-lg group-hover:shadow-primary-500/25"
          />
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: "var(--th-fg-heading)" }}
          >
            ToolsStack
          </span>
          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wider text-emerald-400">
            Free
          </span>
        </Link>

        {/* ---- Center: Desktop nav ---- */}
        <div className="hidden items-center gap-1 md:flex">
          {/* Tools dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setToolsOpen((o) => !o)}
              className="flex items-center gap-1 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-(--th-pill-bg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              style={{ color: "var(--th-header-fg)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--th-fg-heading)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--th-header-fg)")
              }
            >
              Tools
              <svg
                className={`h-3.5 w-3.5 transition-transform duration-200 ${toolsOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>

            {toolsOpen && (
              <div
                className="absolute left-1/2 top-full mt-2 w-80 -translate-x-1/2 animate-slide-down rounded-xl border p-2 shadow-2xl"
                style={{
                  borderColor: "var(--th-border-hover)",
                  backgroundColor: "var(--th-popover-bg)",
                }}
              >
                <div className="max-h-[70vh] overflow-y-auto">
                  {tools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.slug}`}
                      className="group/item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 hover:bg-(--th-pill-bg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      style={{ color: "var(--th-header-fg)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--th-fg-heading)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--th-header-fg)")
                      }
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-(--th-pill-bg) text-base">
                        {tool.icon}
                      </span>
                      <div className="min-w-0">
                        <div
                          className="flex items-center gap-1.5 font-medium"
                          style={{ color: "var(--th-fg-heading)" }}
                        >
                          {tool.shortName}
                          {tool.isNew && (
                            <span className="rounded bg-primary-500/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-400">
                              NEW
                            </span>
                          )}
                        </div>
                        <p
                          className="truncate text-xs"
                          style={{ color: "var(--th-fg-muted)" }}
                        >
                          {tool.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div
                  className="mt-1 border-t pt-1"
                  style={{ borderColor: "var(--th-border)" }}
                >
                  <Link
                    href="/#tools"
                    className="flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-primary-400 transition-colors duration-200 hover:bg-primary-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    View all tools →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/blog"
            className="rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-(--th-pill-bg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            style={{ color: "var(--th-header-fg)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--th-fg-heading)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--th-header-fg)")
            }
          >
            Blog
          </Link>
        </div>

        {/* ---- Right: actions ---- */}
        <div className="flex items-center gap-1.5">
          {/* GitHub */}
          <a
            href="https://github.com/asalwania/toot-stacks"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-(--th-pill-bg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            style={{ color: "var(--th-fg-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--th-fg-heading)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--th-fg-muted)")
            }
          >
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-(--th-pill-bg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            style={{ color: "var(--th-fg-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--th-fg-heading)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--th-fg-muted)")
            }
          >
            {darkMode ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                />
              </svg>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-(--th-pill-bg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 md:hidden"
            style={{ color: "var(--th-fg-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--th-fg-heading)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--th-fg-muted)")
            }
          >
            {mobileOpen ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 9h16.5m-16.5 6.75h16.5"
                />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* ---- Mobile slide-in menu ---- */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={mobileRef}
        className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col transition-transform duration-200 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          borderLeft: "1px solid var(--th-border)",
          backgroundColor: "var(--th-surface)",
        }}
      >
        {/* Mobile header */}
        <div
          className="flex h-16 items-center justify-between px-4"
          style={{ borderBottom: "1px solid var(--th-border)" }}
        >
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--th-fg-heading)" }}
          >
            Menu
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-(--th-pill-bg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            style={{ color: "var(--th-fg-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--th-fg-heading)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--th-fg-muted)")
            }
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
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

        {/* Mobile nav links */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <Link
            href="/#tools"
            className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-(--th-pill-bg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            style={{ color: "var(--th-header-fg)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--th-fg-heading)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--th-header-fg)")
            }
          >
            All Tools
          </Link>
          <Link
            href="/blog"
            className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-(--th-pill-bg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            style={{ color: "var(--th-header-fg)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--th-fg-heading)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--th-header-fg)")
            }
          >
            Blog
          </Link>

          <div
            className="my-3 border-t"
            style={{ borderColor: "var(--th-border)" }}
          />

          <p
            className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--th-fg-muted)" }}
          >
            Tools
          </p>

          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200 hover:bg-(--th-pill-bg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              style={{ color: "var(--th-fg-muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--th-fg-heading)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--th-fg-muted)")
              }
            >
              <span className="text-base">{tool.icon}</span>
              <span>{tool.shortName}</span>
              {tool.isNew && (
                <span className="ml-auto rounded bg-primary-500/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-400">
                  NEW
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Mobile footer */}
        <div
          className="px-4 py-3"
          style={{ borderTop: "1px solid var(--th-border)" }}
        >
          <a
            href="https://github.com/asalwania/toot-stacks"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors duration-200 hover:bg-(--th-pill-bg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            style={{ color: "var(--th-fg-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--th-fg-heading)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--th-fg-muted)")
            }
          >
            <svg
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
