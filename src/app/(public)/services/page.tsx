import { Metadata } from "next";
import ServicesContent from "./ServicesContent";

export const metadata: Metadata = {
  title: "Custom Framing Services in West Roxbury, MA",
  description:
    "Full-service custom picture framing in West Roxbury, MA. Custom frames, matting, shadow boxes, canvas stretching, photo restoration, museum glass, conservation framing & more. Serving Boston since 1981. Walk-ins welcome.",
  keywords: [
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
    title: "Custom Framing Services | West Roxbury Framing",
    description:
      "Custom picture framing, shadow boxes, photo restoration, museum glass & more. Family-owned in West Roxbury since 1981.",
    url: "https://westroxburyframing.com/services",
    images: [
      {
        url: "/framed-art/01.webp",
        width: 1200,
        height: 630,
        alt: "Custom framing services at West Roxbury Framing",
      },
    ],
  },
  alternates: {
    canonical: "https://westroxburyframing.com/services",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much does custom framing cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Custom framing typically ranges from $80–$400+ depending on the frame moulding, mat, glass type, and size. We provide free quotes on the spot — just bring your piece in and we'll give you options at different price points.",
      },
    },
    {
      "@type": "Question",
      name: "How long does custom framing take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most standard orders are ready within 5–7 business days. Rush same-day service is available for an additional fee.",
      },
    },
    {
      "@type": "Question",
      name: "Do you frame sports jerseys and memorabilia?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely — jersey framing is one of our specialties. We build custom shadow boxes for jerseys, signed balls, bats, helmets, medals, patches, and other sports memorabilia.",
      },
    },
    {
      "@type": "Question",
      name: "What type of glass should I choose?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It depends on your piece and where it will hang. Standard clear glass works for most items. UV-filtering conservation glass prevents fading. Museum glass eliminates reflections — ideal for valuable artwork.",
      },
    },
    {
      "@type": "Question",
      name: "Can you fix a broken or damaged frame?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! We repair cracked, chipped, or broken frames. We can also refinish or repaint an existing frame to give it new life.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer discounts for non-profits or military?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — non-profit organizations and active/retired military members receive an additional 5% discount on all framing services.",
      },
    },
    {
      "@type": "Question",
      name: "What areas do you serve?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our shop is in West Roxbury, MA and we serve customers from all over the Boston metro area, including Roslindale, Jamaica Plain, Brookline, Dedham, Needham, Newton, and Hyde Park.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need an appointment?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Walk-ins are always welcome! If you'd like dedicated one-on-one time with our framing expert, you can book a free consultation online.",
      },
    },
  ],
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
