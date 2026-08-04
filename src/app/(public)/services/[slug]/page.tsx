import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SERVICES, getServiceBySlug, getRelatedServices } from "./serviceData";
import ServiceContent from "./ServiceContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};

  const ogImage = service.heroImage || "/logo.png";

  return {
    title: service.metaTitle,
    description: service.metaDescription,
    keywords: service.keywords,
    openGraph: {
      title: service.metaTitle,
      description: service.metaDescription,
      url: `https://www.westroxburyframing.com/services/${service.slug}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${service.heroTitle} ${service.heroTitleAccent} — West Roxbury Framing`,
        },
      ],
    },
    alternates: {
      canonical: `https://www.westroxburyframing.com/services/${service.slug}`,
    },
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const related = getRelatedServices(service.relatedSlugs);

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.metaTitle.split("|")[0].trim(),
    description: service.metaDescription,
    serviceType: service.schemaCategory,
    areaServed: { "@type": "City", name: "Boston" },
    provider: {
      "@type": "LocalBusiness",
      name: "West Roxbury Framing",
      url: "https://www.westroxburyframing.com",
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
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5.0",
        reviewCount: "100",
        bestRating: "5",
      },
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: service.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <ServiceContent service={service} related={related} />
    </>
  );
}
