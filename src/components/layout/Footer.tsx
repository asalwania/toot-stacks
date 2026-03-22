import Link from "next/link";
import { tools } from "@/lib/tools-registry";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface-900">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* ---- Col 1: Brand ---- */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-primary-500 to-accent-500 font-mono text-xs font-bold text-white">
                &lt;/&gt;
              </span>
              <span className="text-lg font-bold tracking-tight text-white">
                DevToolkit
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-400">
              Free developer tools. Zero tracking. 100% in-browser.
            </p>
          </div>

          {/* ---- Col 2: Tools ---- */}
          <div>
            <h3 className="text-sm font-semibold text-white">Tools</h3>
            <ul className="mt-4 space-y-2.5">
              {tools.map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <span className="text-xs">{tool.icon}</span>
                    {tool.shortName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ---- Col 3: Resources ---- */}
          <div>
            <h3 className="text-sm font-semibold text-white">Resources</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-gray-400 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  Blog
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  GitHub
                  <svg
                    className="h-3 w-3 opacity-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                    />
                  </svg>
                </a>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-400 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-400 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ---- Bottom bar ---- */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-gray-500">
            &copy; 2026 DevToolkit. All tools process data locally in your
            browser.
          </p>
          <p className="text-xs text-gray-600">
            Built with{" "}
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-400 underline decoration-gray-700 underline-offset-2 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Next.js
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
