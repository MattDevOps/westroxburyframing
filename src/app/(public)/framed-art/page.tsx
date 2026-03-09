import { Metadata } from "next";
import FramedArtContent from "./FramedArtContent";

export const metadata: Metadata = {
  title: "Custom Framing Gallery | Our Work — West Roxbury Framing",
  description:
    "Browse our custom framing gallery. Sports jerseys, diplomas, fine art, shadow boxes, flags, memorabilia & more — all framed by hand in West Roxbury, MA. See our recent projects.",
  keywords: [
    "custom framing gallery",
    "framed art West Roxbury",
    "jersey framing gallery",
    "shadow box gallery",
    "custom picture framing examples",
    "diploma framing gallery",
    "sports memorabilia framing Boston",
    "custom framing portfolio",
  ],
  openGraph: {
    title: "Our Work — Custom Framing Gallery | West Roxbury Framing",
    description:
      "Browse our portfolio of custom framed pieces — jerseys, diplomas, fine art, shadow boxes & more.",
    url: "https://westroxburyframing.com/framed-art",
    images: [
      {
        url: "/framed-art/brady-jersey.webp",
        width: 1200,
        height: 630,
        alt: "Custom shadow box framed Tom Brady Patriots jersey — West Roxbury Framing",
      },
    ],
  },
  alternates: {
    canonical: "https://westroxburyframing.com/framed-art",
  },
};

export default function FramedArtPage() {
  return <FramedArtContent />;
}
