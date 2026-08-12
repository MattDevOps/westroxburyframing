import { Metadata } from "next";
import ReviewContent from "./ReviewContent";

export const metadata: Metadata = {
  title: { absolute: "Leave Us a Review | West Roxbury Framing" },
  description:
    "Share your experience with West Roxbury Framing. Your feedback helps us serve you better and helps others find quality custom framing in Boston.",
  robots: { index: false, follow: false },
};

export default function ReviewPage() {
  return <ReviewContent />;
}
