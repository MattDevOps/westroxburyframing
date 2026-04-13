import { Metadata } from "next";
import CustomFramingContent from "./CustomFramingContent";

export const metadata: Metadata = {
  title: "Get a Custom Framing Quote Online | West Roxbury Framing",
  description:
    "Request a free custom framing quote online from West Roxbury Framing. Upload photos of your artwork, jersey, diploma, or memorabilia and we'll get back to you with pricing. Serving Boston and Greater Boston since 1981.",
  keywords: [
    "custom framing quote",
    "framing quote online Boston",
    "picture framing quote West Roxbury",
    "custom frame price estimate",
    "jersey framing quote",
    "diploma framing quote",
    "custom framing request",
  ],
  openGraph: {
    title: "Get a Custom Framing Quote Online | West Roxbury Framing",
    description:
      "Submit your framing request online and receive a personalized quote. Upload photos, describe your piece, and our team will get back to you within one business day.",
    url: "https://westroxburyframing.com/custom-framing",
  },
  alternates: {
    canonical: "https://westroxburyframing.com/custom-framing",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I get a custom framing quote online?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Upload photos of your piece using the form on this page, include the dimensions, and tell us what you have in mind. We'll reply within one business day with pricing options at different levels.",
      },
    },
    {
      "@type": "Question",
      name: "Can I get a custom framing quote in person?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely — walk-ins are always welcome at our shop at 1741 Centre St in West Roxbury. Bring your piece in and we'll give you a quote on the spot with options at different price points.",
      },
    },
    {
      "@type": "Question",
      name: "What items can be custom framed?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We custom frame almost anything: artwork, photographs, diplomas, sports jerseys, flags, military medals, 3D memorabilia, mirrors, canvases, needlework, maps, and more. If you're not sure, just ask — we've framed it all.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer same-day custom framing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — same-day framing is available for an additional fee. Standard orders are ready in 5–7 business days. Let us know your timeline and we'll accommodate.",
      },
    },
  ],
};

export default function CustomFramingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <CustomFramingContent />
    </>
  );
}
