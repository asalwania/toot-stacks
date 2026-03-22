import Link from "next/link";

const popularTools = [
  { name: "JSON Formatter", slug: "json-formatter" },
  { name: "Password Generator", slug: "password-generator" },
  { name: "Image Compressor", slug: "image-compressor" },
  { name: "Regex Tester", slug: "regex-tester" },
];

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20">
      <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
        Error 404
      </p>
      <h1 className="mb-2 text-8xl font-extrabold tracking-tight text-foreground sm:text-9xl">
        404
      </h1>
      <h2 className="mb-4 text-2xl font-semibold text-foreground">
        Page not found
      </h2>
      <p className="mb-8 max-w-md text-center text-muted-foreground">
        The page you are looking for does not exist or has been moved. Try one of
        our popular tools instead.
      </p>

      <Link
        href="/"
        className="mb-12 inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        Back to Home
      </Link>

      <div className="w-full max-w-md">
        <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Popular Tools
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {popularTools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="rounded-lg border border-border/50 bg-card px-4 py-3 text-center text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {tool.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
