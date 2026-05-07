import { Metadata } from "next";
import TestimonialsContent from "./TestimonialsContent";

export const metadata: Metadata = {
  title: "Customer Reviews | 100+ Five-Star Google Reviews",
  description:
    "Read 100+ five-star Google reviews from customers of West Roxbury Framing. Trusted for custom picture framing, jersey framing, diploma framing, photo restoration & more in West Roxbury, MA and Greater Boston.",
  keywords: [
    "West Roxbury Framing reviews",
    "custom framing reviews Boston",
    "best picture framing near me reviews",
    "five star framing shop Boston",
    "West Roxbury Framing testimonials",
  ],
  openGraph: {
    title: "Customer Reviews | West Roxbury Framing",
    description:
      "100+ five-star Google reviews. See why customers across Boston trust West Roxbury Framing for their custom picture framing needs.",
    url: "https://westroxburyframing.com/testimonials",
  },
  alternates: {
    canonical: "https://westroxburyframing.com/testimonials",
  },
};

export default function TestimonialsPage() {
  return <TestimonialsContent />;
}
