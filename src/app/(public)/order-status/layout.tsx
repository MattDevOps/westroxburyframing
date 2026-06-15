import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Track Your Order",
  robots: { index: false, follow: false },
};

export default function OrderStatusLayout({ children }: { children: ReactNode }) {
  return children;
}
