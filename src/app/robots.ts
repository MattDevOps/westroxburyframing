import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Never crawl: staff area, API, and per-invoice pay links.
        // Auth/account pages are left crawlable so Google can read their
        // per-page noindex tag and properly drop them from the index.
        disallow: ["/staff/", "/api/", "/pay/"],
      },
    ],
    sitemap: "https://westroxburyframing.com/sitemap.xml",
  };
}
