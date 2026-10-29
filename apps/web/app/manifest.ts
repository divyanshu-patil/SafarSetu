import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SafarSetu — plan your work around public transport",
    short_name: "SafarSetu",
    description: "Organise your work and errands around the buses, metro and trains you can catch — with calm alerts in English, Hindi and Marathi.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#163300",
    lang: "en-IN",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
