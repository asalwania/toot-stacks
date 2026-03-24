import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ToolsStack",
    short_name: "ToolsStack",
    description:
      "A collection of free, fast, and privacy-friendly developer tools. JSON formatter, image compressor, password generator, and more.",
    start_url: "/",
    display: "standalone",
    theme_color: "#6366f1",
    background_color: "#09090b",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
