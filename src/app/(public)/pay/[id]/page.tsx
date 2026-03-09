import type { Metadata } from "next";
import PaymentContent from "./PaymentContent";

export const metadata: Metadata = {
  title: "Pay Invoice | West Roxbury Framing",
  description: "Securely pay your framing invoice online.",
  robots: { index: false, follow: false },
};

export default function PayPage() {
  return <PaymentContent />;
}
