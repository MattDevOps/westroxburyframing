"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const STAFF_NAV = [
  { href: "/staff/dashboard", label: "Dashboard" },
  { href: "/staff/orders", label: "Orders" },
  { href: "/staff/orders/incomplete", label: "Incomplete" },
  { href: "/staff/orders/new", label: "New order" },
  { href: "/staff/invoices", label: "Invoices" },
  { href: "/staff/appointments", label: "Appts" },
  { href: "/staff/customers", label: "Customers" },
  { href: "/staff/marketing/email-blast", label: "Email Blast" },
  { href: "/staff/pricing", label: "Pricing" },
  { href: "/staff/materials-needed", label: "Materials" },
  { href: "/staff/purchase-orders", label: "POs" },
  { href: "/staff/inventory", label: "Inventory" },
  { href: "/staff/gallery", label: "Gallery" },
  { href: "/staff/reports", label: "Reports" },
  { href: "/staff/users", label: "Users" },
];

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();

  // For exact matches, or sub-route matching (but orders/invoices need special handling)
  const isOrdersRoot = href === "/staff/orders";
  const isInvoicesRoot = href === "/staff/invoices";
  const active =
    pathname === href ||
    (isOrdersRoot && pathname === "/staff/orders") ||
    (isInvoicesRoot && pathname === "/staff/invoices") ||
    (href.startsWith("/staff/orders/") && pathname.startsWith(href)) ||
    (href.startsWith("/staff/invoices/") && pathname.startsWith(href)) ||
    (!isOrdersRoot && !isInvoicesRoot &&
     !href.startsWith("/staff/orders") && !href.startsWith("/staff/invoices") &&
     pathname.startsWith(href));

  return (
    <a
      href={href}
      onClick={onClick}
      className={[
        "text-sm px-3 py-2 rounded-md transition block",
        active
          ? "bg-neutral-900 text-white"
          : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100",
      ].join(" ")}
    >
      {children}
    </a>
  );
}

export default function StaffTopbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-neutral-200 bg-white no-print">
      <div className="mx-auto max-w-7xl px-4">
        {/* First row: Logo and Navigation */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="flex items-center shrink-0">
              <Image
                src="/logo.png"
                alt="West Roxbury Framing"
                width={140}
                height={48}
                className="h-10 md:h-12 w-auto"
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex gap-1 flex-wrap">
              {STAFF_NAV.map((link) => (
                <NavLink key={link.href} href={link.href}>
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-neutral-100 shrink-0"
            aria-label="Toggle navigation"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Second row: Logout button */}
        <div className="flex items-center justify-end pb-3 border-t border-neutral-100 pt-2">
          <form action="/staff/api/auth/logout" method="post" className="shrink-0">
            <button 
              type="submit"
              className="text-sm rounded-xl border border-neutral-300 text-neutral-800 px-4 py-2 hover:bg-neutral-100 whitespace-nowrap font-medium"
            >
              Log out
            </button>
          </form>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white px-4 py-3">
          <nav className="flex flex-col gap-1">
            {STAFF_NAV.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
