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

export default function CustomFramingPage() {
  return <CustomFramingContent />;
}
