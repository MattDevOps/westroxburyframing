"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const SIDEBAR_GROUPS: Array<{
  label: string;
  links: Array<{ href: string; label: string }>;
}> = [
  {
    label: "Operations",
    links: [
      { href: "/staff/orders/incomplete", label: "Incomplete Orders" },
      { href: "/staff/invoices", label: "Invoices" },
      { href: "/staff/appointments", label: "Appointments" },
      { href: "/staff/gift-certificates", label: "Gift Certificates" },
      { href: "/staff/customer-form", label: "Customer Form" },
    ],
  },
  {
    label: "Catalog & Inventory",
    links: [
      { href: "/staff/pricing", label: "Pricing" },
      { href: "/staff/materials-needed", label: "Materials Needed" },
      { href: "/staff/purchase-orders", label: "Purchase Orders" },
      { href: "/staff/inventory", label: "Inventory" },
      { href: "/staff/gallery", label: "Gallery" },
    ],
  },
  {
    label: "Marketing",
    links: [
      { href: "/staff/marketing/email-blast", label: "Email Blast" },
      { href: "/staff/marketing/gbp-posts", label: "GBP Posts" },
      { href: "/staff/marketing/utm-links", label: "UTM Links" },
      { href: "/staff/marketing/drafts", label: "Email Drafts" },
      { href: "/staff/photo-intake", label: "Photo Intake" },
    ],
  },
  {
    label: "Admin",
    links: [
      { href: "/staff/reports", label: "Reports" },
      { href: "/staff/users", label: "Users" },
      { href: "/staff/settings/twilio", label: "Twilio Settings" },
    ],
  },
];

export default function StaffSidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/staff/api/location/current")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setUserRole(data.userRole || null))
      .catch(() => {});
  }, []);

  // Receptionists don't get the sidebar — they have a focused topbar already
  if (userRole === "receptionist") return null;

  return (
    <aside className="hidden lg:block w-56 shrink-0 border-r border-neutral-200 bg-neutral-50 no-print">
      <nav className="sticky top-0 p-4 space-y-5 max-h-screen overflow-y-auto">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-1.5 px-2">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.links.map((link) => {
                const active =
                  pathname === link.href ||
                  pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-2 py-1.5 rounded text-sm transition ${
                      active
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
