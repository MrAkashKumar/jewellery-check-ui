import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JwellCheck",
    short_name: "JwellCheck",
    description:
      "Compare jewellery quotations with a clear final-price breakdown.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ed",
    theme_color: "#2b2721",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
