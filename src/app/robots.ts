import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/server/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/checkout", "/en/checkout", "/order/", "/en/order/"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
