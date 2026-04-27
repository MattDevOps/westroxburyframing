import { Metadata } from "next";
import InstantQuoteContent from "./InstantQuoteContent";

export const metadata: Metadata = {
  title: "Instant Quote | West Roxbury Framing",
  description:
    "Upload a photo of what you want framed and get a ballpark estimate in seconds. Custom framing in West Roxbury, Boston.",
};

export default function InstantQuotePage() {
  return <InstantQuoteContent />;
}
