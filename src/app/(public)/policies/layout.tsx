import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How West Roxbury Framing collects, uses, and protects your information, including email and SMS communication preferences and payment processing.",
  alternates: { canonical: "https://westroxburyframing.com/policies" },
};

export default function PoliciesLayout({ children }: { children: ReactNode }) {
  return children;
}
