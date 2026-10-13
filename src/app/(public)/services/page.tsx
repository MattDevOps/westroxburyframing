import { Metadata } from "next";
import ServicesContent from "./ServicesContent";
import { FAQS } from "./faqs";

export const metadata: Metadata = {
  title: "Framing Services & Rush Same-Day Framing — West Roxbury, MA",
  description:
    "Full-service framer in West Roxbury, MA offering rush same-day custom framing, matting, shadow boxes, canvas stretching, photo restoration, museum glass & conservation framing. Your local frame shop serving Boston since 1981. Walk-ins welcome.",
  keywords: [
    "framer",
    "frame",
    "frame shop",
    "framer near me",
    "frame shop near me",
    "rush framing",
    "rush framing near me",
    "rush framing Boston",
    "same day framing",
    "same-day framing near me",
    "same day picture framing Boston",
    "fast framing West Roxbury",
    "emergency framing Boston",
    "urgent framing near me",
    "last minute framing Boston",
    "overnight framing Boston",
    "quick framing near me",
    "custom framing services West Roxbury",
    "picture framing Boston",
    "shadow box framing near me",
    "jersey framing Boston",
    "photo restoration West Roxbury",
    "museum glass framing",
    "canvas stretching Boston",
    "diploma framing West Roxbury MA",
    "frame repair near me",
    "custom matting Boston",
    "conservation framing",
    "affordable custom framing Boston",
  ],
  openGraph: {
    title: "Frame Shop & Rush Same-Day Framing | West Roxbury Framing",
    description:
      "Your local framer — rush same-day framing, custom picture frames, shadow boxes, photo restoration, museum glass & more. Family-owned frame shop in West Roxbury since 1981.",
    url: "https://www.westroxburyframing.com/services",
    images: [
      {
        url: "/og-image.jpg",
        width: 482,
        height: 483,
        alt: "Custom framing services at West Roxbury Framing",
      },
    ],
  },
  alternates: {
    canonical: "https://www.westroxburyframing.com/services",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <ServicesContent />
    </>
  );
}
