import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SERVICE_AREAS, getAreaBySlug } from "./areaData";
import AreaContent from "./AreaContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return SERVICE_AREAS.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) return {};

  const title = `Custom Framing Near ${area.name}, MA | West Roxbury Framing`;
  const description = `Custom picture framing for ${area.name} residents — ${area.distance} from ${area.name}. Custom frames, shadow boxes, photo restoration, museum glass & more. 40+ years experience. Walk-ins welcome. Free parking.`;

  return {
    title,
    description,
    keywords: [
      `custom framing ${area.name}`,
      `picture framing near ${area.name}`,
      `framing shop near ${area.name} MA`,
      `custom framing near me ${area.name}`,
      `shadow box framing ${area.name}`,
      `photo restoration ${area.name}`,
      `jersey framing ${area.name}`,
      `diploma framing near ${area.name}`,
    ],
    openGraph: {
      title,
      description,
      url: `https://westroxburyframing.com/areas/${area.slug}`,
      images: [
        {
          url: "/framed-art/01.webp",
          width: 1200,
          height: 630,
          alt: `Custom picture framing near ${area.name} — West Roxbury Framing`,
        },
      ],
    },
    alternates: {
      canonical: `https://westroxburyframing.com/areas/${area.slug}`,
    },
  };
}

export default async function AreaPage({ params }: PageProps) {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) notFound();

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "West Roxbury Framing",
    description: `Custom picture framing shop serving ${area.name}, MA and Greater Boston since 1981.`,
    url: `https://westroxburyframing.com/areas/${area.slug}`,
    telephone: "+1-617-327-3890",
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
    areaServed: {
      "@type": "City",
      name: area.name,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "100",
      bestRating: "5",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <AreaContent area={area} />
    </>
  );
}
