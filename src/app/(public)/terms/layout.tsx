import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms and conditions for using West Roxbury Framing's website and custom framing services.",
  alternates: { canonical: "https://www.westroxburyframing.com/terms" },
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}
