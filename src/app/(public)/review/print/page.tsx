import { Metadata } from "next";
import PrintableReviewCard from "./PrintableReviewCard";

export const metadata: Metadata = {
  title: { absolute: "Print Review Card | West Roxbury Framing" },
  robots: { index: false, follow: false },
};

export default function PrintReviewCardPage() {
  return <PrintableReviewCard />;
}
