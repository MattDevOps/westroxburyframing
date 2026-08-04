import { Metadata } from "next";
import RestorationContent from "./RestorationContent";

export const metadata: Metadata = {
  title: "Photo & Frame Restoration in West Roxbury, MA",
  description:
    "Professional photo restoration and frame repair in West Roxbury, MA. We restore faded, torn, water-damaged, and antique photographs. Frame refinishing and structural repair. Free assessments. Serving Boston since 1981.",
  keywords: [
    "photo restoration West Roxbury",
    "photo restoration Boston",
    "frame repair near me",
    "antique photo restoration",
    "damaged photo repair Boston",
    "frame restoration West Roxbury",
    "water damage photo repair",
    "old photo restoration near me",
    "picture frame repair Boston",
    "digital photo repair",
  ],
  openGraph: {
    title: "Photo & Frame Restoration | West Roxbury Framing",
    description:
      "Professional photo restoration and frame repair in West Roxbury, MA. Antique photos, water damage, torn photos, broken frames — bring it in for a free assessment.",
    url: "https://www.westroxburyframing.com/restoration",
    images: [
      {
        url: "/restoration/1.jpg",
        width: 1200,
        height: 630,
        alt: "Photo restoration before and after — West Roxbury Framing",
      },
    ],
  },
  alternates: {
    canonical: "https://www.westroxburyframing.com/restoration",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can you restore a torn or water-damaged photo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — we restore photos with tears, creases, water damage, mold, fading, and discoloration. We create a high-quality restored copy for framing while preserving the original untouched.",
      },
    },
    {
      "@type": "Question",
      name: "How much does photo restoration cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Photo restoration pricing depends on the condition of the original — minor repairs are quick, heavily damaged images take more work. Bring your photo in for a free assessment and we'll work out the pricing in person.",
      },
    },
    {
      "@type": "Question",
      name: "Can you repair a broken picture frame?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. We repair cracked, chipped, warped, and broken frames. We can also refinish, repaint, or regild an existing frame to restore it to its original beauty.",
      },
    },
    {
      "@type": "Question",
      name: "How long does photo restoration take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most photo restorations are completed within 5–10 business days, depending on the extent of the damage. Simple repairs may be faster. We'll give you a timeline when you bring it in.",
      },
    },
    {
      "@type": "Question",
      name: "Do you restore antique or very old photographs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — we've restored photographs dating back over 100 years. We work carefully with fragile antique prints, daguerreotypes, and vintage photos to bring them back to life.",
      },
    },
  ],
};

export default function RestorationPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <RestorationContent />
    </>
  );
}
