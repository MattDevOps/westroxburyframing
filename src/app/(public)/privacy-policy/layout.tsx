import type { Metadata } from "next";
import type { ReactNode } from "react";

// Near-duplicate of /policies (the footer-linked canonical privacy page).
// Point the canonical there so search engines consolidate on /policies.
export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How West Roxbury Framing collects, uses, and protects your information, including email and SMS communication preferences and payment processing.",
  alternates: { canonical: "https://www.westroxburyframing.com/policies" },
};

export default function PrivacyPolicyLayout({ children }: { children: ReactNode }) {
  return children;
}
