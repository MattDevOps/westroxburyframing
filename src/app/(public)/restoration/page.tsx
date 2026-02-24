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
    url: "https://westroxburyframing.com/restoration",
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
    canonical: "https://westroxburyframing.com/restoration",
  },
};

export default function RestorationPage() {
  return <RestorationContent />;
}
