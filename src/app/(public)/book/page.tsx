import { Metadata } from "next";
import BookContent from "./BookContent";

export const metadata: Metadata = {
  title: "Book a Free Framing Consultation | West Roxbury Framing",
  description:
    "Book a free custom framing consultation with West Roxbury Framing. Meet in person at our West Roxbury, MA shop or over the phone. Walk-ins also welcome. Expert framing design advice — no obligation.",
  keywords: [
    "book framing consultation",
    "free framing consultation Boston",
    "custom framing appointment West Roxbury",
    "picture framing consultation near me",
    "framing design consultation",
  ],
  openGraph: {
    title: "Book a Free Framing Consultation | West Roxbury Framing",
    description:
      "Schedule a complimentary framing consultation. Meet in person at our West Roxbury shop or talk over the phone. No obligation.",
    url: "https://westroxburyframing.com/book",
  },
  alternates: {
    canonical: "https://westroxburyframing.com/book",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What should I bring to my framing consultation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Bring the artwork, photo, or item you'd like framed. If it's too large, bring a photo with approximate dimensions. Reference images for styles or colors are helpful too.",
      },
    },
    {
      "@type": "Question",
      name: "How long does a framing consultation take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most consultations take about 15–30 minutes. We'll discuss your piece, help you choose the right frame, mat, and glass, and give you a price on the spot.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need an appointment for custom framing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Walk-ins are always welcome! Appointments guarantee dedicated time with our framing expert, especially for complex projects like shadowboxes or multi-piece arrangements.",
      },
    },
    {
      "@type": "Question",
      name: "How long does custom framing take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most standard custom framing orders are ready within 5–7 business days. Rush same-day service is available for an additional fee.",
      },
    },
    {
      "@type": "Question",
      name: "Is there parking at West Roxbury Framing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! Free street parking is available directly in front of our shop on Centre Street, with additional parking in the municipal lot behind the building.",
      },
    },
    {
      "@type": "Question",
      name: "What types of items can you frame?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Almost anything — art prints, photographs, diplomas, certificates, sports jerseys, military memorabilia, flags, 3D objects, mirrors, canvases, and more.",
      },
    },
  ],
};

export default function BookPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <BookContent />
    </>
  );
}
