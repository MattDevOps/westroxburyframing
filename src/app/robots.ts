import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/staff/", "/api/", "/account", "/login", "/signup", "/pay/"],
      },
    ],
    sitemap: "https://westroxburyframing.com/sitemap.xml",
  };
}
