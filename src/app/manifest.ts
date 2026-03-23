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
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
