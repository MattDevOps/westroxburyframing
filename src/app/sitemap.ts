import { MetadataRoute } from "next";
import { blogPosts } from "./(public)/blog/posts";
import { SERVICES as NICHE_SERVICES } from "./(public)/services/[slug]/serviceData";

const BASE_URL = "https://westroxburyframing.com";

// Neighborhoods we serve — each gets a landing page
const SERVICE_AREAS = [
  "west-roxbury",
  "roslindale",
  "jamaica-plain",
  "brookline",
  "dedham",
  "needham",
  "newton",
  "hyde-park",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/custom-framing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/framed-art`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/restoration`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/testimonials`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/book`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  const serviceAreaPages: MetadataRoute.Sitemap = SERVICE_AREAS.map((area) => ({
    url: `${BASE_URL}/areas/${area}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const nicheServicePages: MetadataRoute.Sitemap = NICHE_SERVICES.map((s) => ({
    url: `${BASE_URL}/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...serviceAreaPages, ...nicheServicePages, ...blogPages];
}
