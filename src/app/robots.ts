import type { MetadataRoute } from "next";
import { APP } from "@/config/app-constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: APP.links.home, disallow: ["/saved", "/settings"] }],
    sitemap: `${APP.baseUrl}/sitemap.xml`,
  };
}
