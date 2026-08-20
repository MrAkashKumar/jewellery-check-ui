import type { MetadataRoute } from "next";
import { APP, SEO } from "@/config/app-constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP.name,
    short_name: APP.name,
    description: SEO.manifestDescription,
    start_url: APP.links.home,
    display: "standalone",
    background_color: SEO.theme.light,
    theme_color: SEO.theme.manifest,
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
