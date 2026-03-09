import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: {
    default: "West Roxbury Framing | Custom Picture Framing in West Roxbury, MA",
    template: "%s | West Roxbury Framing",
  },
  description:
    "Custom picture framing in West Roxbury, MA since 1981. Art, photos, diplomas, memorabilia, shadowboxes, restoration & more. Walk-ins welcome. Free parking.",
  keywords: [
    "custom framing",
    "picture framing",
    "West Roxbury",
    "Boston framing",
    "shadowbox",
    "diploma framing",
    "memorabilia framing",
    "photo restoration",
    "frame repair",
    "museum glass",
    "Roslindale",
    "Jamaica Plain",
    "Dedham",
    "Brookline",
  ],
  openGraph: {
    title: "West Roxbury Framing | Custom Picture Framing in West Roxbury, MA",
    description:
      "Family-owned custom picture framing shop serving Boston since 1981. Art, photos, diplomas, memorabilia, shadowboxes & more. Walk-ins welcome.",
    url: "https://westroxburyframing.com",
    siteName: "West Roxbury Framing",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/framed-art/01.webp",
        width: 1200,
        height: 630,
        alt: "West Roxbury Framing — Custom Picture Framing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "West Roxbury Framing | Custom Picture Framing in West Roxbury, MA",
    description:
      "Family-owned custom picture framing shop serving Boston since 1981. Walk-ins welcome.",
    images: ["/framed-art/01.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://westroxburyframing.com",
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://westroxburyframing.com",
  name: "West Roxbury Framing",
  description:
    "Custom picture framing shop specializing in art, photos, diplomas, memorabilia, shadowboxes, restoration and repair since 1981.",
  url: "https://westroxburyframing.com",
  telephone: "+1-617-327-3890",
  email: "jake@westroxburyframing.com",
  image: "https://westroxburyframing.com/framed-art/01.webp",
  logo: "https://westroxburyframing.com/logo.png",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1741 Centre St",
    addressLocality: "West Roxbury",
    addressRegion: "MA",
    postalCode: "02132",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 42.287442,
    longitude: -71.150185,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:30",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "10:30",
      closes: "16:30",
    },
  ],
  priceRange: "$$",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    reviewCount: "100",
    bestRating: "5",
  },
  sameAs: [
    "https://www.facebook.com/WestRoxburyFraming/",
    "https://www.instagram.com/westroxburyframing/",
    "https://www.yelp.com/biz/west-roxbury-framing-west-roxbury",
  ],
  areaServed: [
    { "@type": "City", name: "West Roxbury" },
    { "@type": "City", name: "Roslindale" },
    { "@type": "City", name: "Jamaica Plain" },
    { "@type": "City", name: "Dedham" },
    { "@type": "City", name: "Brookline" },
    { "@type": "City", name: "Boston" },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Framing Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Custom Picture Framing" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Shadowbox Framing" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Diploma & Certificate Framing" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Photo Restoration" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Canvas Stretching" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Frame Repair" } },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
