import type { MetadataRoute } from "next";
import { APP } from "@/config/app-constants";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: APP.baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
