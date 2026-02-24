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
    url: "https://westroxburyframing.com/about",
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
    canonical: "https://westroxburyframing.com/about",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
