import type { Metadata } from "next";
import type { ReactNode } from "react";

// Kept indexable on purpose: a publicly reachable SMS opt-in page is required
// for A2P 10DLC / carrier campaign verification.
export const metadata: Metadata = {
  title: "SMS Updates & Opt-In",
  description:
    "Opt in to receive order status updates and pickup reminders from West Roxbury Framing by text message. Message and data rates may apply. Reply STOP to opt out.",
  alternates: { canonical: "https://www.westroxburyframing.com/sms-opt-in" },
};

export default function SmsOptInLayout({ children }: { children: ReactNode }) {
  return children;
}
