import { Metadata } from "next";
import AboutContent from "./AboutContent";

export const metadata: Metadata = {
  title: "About West Roxbury Framing | Family-Owned Since 1981",
  description:
    "West Roxbury Framing is a family-owned custom picture framing shop in West Roxbury, MA. Serving Boston since 1981. 2024 Boston Legacy Business Award recipient. Custom frames, restoration, shadow boxes & more.",
  keywords: [
    "West Roxbury Framing",
    "custom framing Boston",
    "family owned framing shop",
    "picture framing West Roxbury",
    "Boston Legacy Business Award",
    "Moses Hasson framing",
    "best framing shop Boston",
  ],
  openGraph: {
    title: "About West Roxbury Framing | Family-Owned Since 1981",
    description:
      "Family-owned custom picture framing shop serving Boston since 1981. 2024 Boston Legacy Business Award recipient.",
    url: "https://www.westroxburyframing.com/about",
    images: [
      {
        url: "/home/2024-legacy-award-mayor-wu.jpg",
        width: 1200,
        height: 630,
        alt: "West Roxbury Framing — 2024 Boston Legacy Business Award with Mayor Wu",
      },
    ],
  },
  alternates: {
    canonical: "https://www.westroxburyframing.com/about",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How long has West Roxbury Framing been in business?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "West Roxbury Framing has been in business since 1981 — over 45 years of custom picture framing in the Boston area. We are a recipient of the 2024 Boston Legacy Business Award.",
      },
    },
    {
      "@type": "Question",
      name: "Is West Roxbury Framing family-owned?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — West Roxbury Framing is a family-owned and operated business with deep roots in the West Roxbury community. We take pride in treating every customer like family.",
      },
    },
    {
      "@type": "Question",
      name: "What is the Boston Legacy Business Award?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Boston Legacy Business Award recognizes long-standing businesses with historic significance and a commitment to the community. West Roxbury Framing was one of a select few businesses in Boston to receive this honor in 2024.",
      },
    },
    {
      "@type": "Question",
      name: "Where is West Roxbury Framing located?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We're located at 1741 Centre Street, West Roxbury, MA 02132. Free parking is available on Centre Street and behind the building. We serve customers from all over the Boston metro area.",
      },
    },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <AboutContent />
    </>
  );
}
