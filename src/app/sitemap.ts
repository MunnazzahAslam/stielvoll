import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/server/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const languages = { de: base, en: `${base}/en` };
  return [
    { url: base, alternates: { languages }, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/en`, alternates: { languages }, changeFrequency: "monthly", priority: 0.9 },
  ];
}
