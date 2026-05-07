import { Metadata } from "next";
import ContactContent from "./ContactContent";

export const metadata: Metadata = {
  title: "Contact West Roxbury Framing | Hours, Address & Directions",
  description:
    "Contact West Roxbury Framing at 1741 Centre Street, West Roxbury, MA 02132. Call (617) 327-3890. Mon-Fri 9:30am-6pm, Sun 10:30am-4:30pm. Walk-ins welcome. Free parking available.",
  keywords: [
    "West Roxbury Framing contact",
    "framing shop West Roxbury",
    "picture framing near me",
    "custom framing West Roxbury hours",
    "1741 Centre Street West Roxbury",
    "framing shop open Sunday Boston",
  ],
  openGraph: {
    title: "Contact West Roxbury Framing",
    description:
      "Visit us at 1741 Centre Street, West Roxbury, MA 02132. Call (617) 327-3890. Walk-ins welcome, free parking.",
    url: "https://westroxburyframing.com/contact",
  },
  alternates: {
    canonical: "https://westroxburyframing.com/contact",
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
