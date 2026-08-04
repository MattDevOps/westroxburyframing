import { Metadata } from "next";
import GiftCardsContent from "./GiftCardsContent";

export const metadata: Metadata = {
  title: "Gift Cards | West Roxbury Framing",
  description:
    "Send a West Roxbury Framing gift card by email. Choose any amount from $10 to $1,000. Recipients pick out a custom frame, photo restoration, or any service in our Boston shop. Gift certificates never expire.",
  keywords: [
    "West Roxbury Framing gift card",
    "custom framing gift certificate",
    "framing gift Boston",
    "art gift card",
    "frame shop gift card",
  ],
  openGraph: {
    title: "Gift Cards — West Roxbury Framing",
    description:
      "Send a gift card by email — recipients can use it for custom framing, photo restoration, or anything in our shop. Never expires.",
    url: "https://www.westroxburyframing.com/gift-cards",
  },
  alternates: {
    canonical: "https://www.westroxburyframing.com/gift-cards",
  },
};

export default function GiftCardsPage() {
  return <GiftCardsContent />;
}
