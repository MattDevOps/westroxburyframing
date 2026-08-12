import { Metadata } from "next";
import CustomFramingContent from "./CustomFramingContent";

export const metadata: Metadata = {
  title: { absolute: "Tell Us About Your Custom Framing Project | West Roxbury Framing" },
  description:
    "Tell us about your custom framing project online — upload photos and describe what you'd like framed, and we'll set up a time for you to come in for a design consultation. Boston-area framer since 1981.",
  keywords: [
    "custom framing Boston",
    "custom framing West Roxbury",
    "picture framing consultation",
    "framing project intake Boston",
    "jersey framing consultation",
    "diploma framing consultation",
    "custom framing request",
    "Boston frame shop appointment",
  ],
  openGraph: {
    title: "Tell Us About Your Custom Framing Project | West Roxbury Framing",
    description:
      "Tell us about your custom framing project online and we'll set up a time for you to come in. Pricing is always worked out in person at the shop.",
    url: "https://www.westroxburyframing.com/custom-framing",
  },
  alternates: {
    canonical: "https://www.westroxburyframing.com/custom-framing",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does the custom framing process work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tell us about your project using the form on this page (or just walk into the shop). We'll set up a time for you to come in with the piece. We design the frame with you in person and work out the pricing on the spot — every job is custom, so we need to see the piece to be accurate.",
      },
    },
    {
      "@type": "Question",
      name: "Can I get pricing online or over the phone?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every job is custom — pricing depends on the moulding, mat, glass type, and size of your piece. We work out pricing in person so we can show you options at different price points and you can see the materials. Walk-ins are always welcome at 1741 Centre Street, West Roxbury.",
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
