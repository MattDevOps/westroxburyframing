"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const STAFF_NAV: Array<{
  href: string;
  label: string;
  shortcut?: string;
  badge?: boolean;
  highlight?: boolean;
}> = [
  { href: "/staff/dashboard", label: "Dashboard" },
  { href: "/staff/search", label: "Search", shortcut: "⌘K" },
  { href: "/staff/messages", label: "Messages", badge: true },
  { href: "/staff/orders", label: "Orders" },
  { href: "/staff/orders/incomplete", label: "Incomplete" },
  { href: "/staff/orders/intake", label: "New Order", highlight: true },
  { href: "/staff/orders/new", label: "Advanced" },
  { href: "/staff/invoices", label: "Invoices" },
  { href: "/staff/appointments", label: "Appts" },
  { href: "/staff/customers", label: "Customers" },
  { href: "/staff/gift-certificates", label: "Gift Certs" },
  { href: "/staff/products", label: "Products" },
  { href: "/staff/marketing/email-blast", label: "Email Blast" },
  { href: "/staff/pricing", label: "Pricing" },
  { href: "/staff/materials-needed", label: "Materials" },
  { href: "/staff/purchase-orders", label: "POs" },
  { href: "/staff/inventory", label: "Inventory" },
  { href: "/staff/gallery", label: "Gallery" },
  { href: "/staff/reports", label: "Reports" },
  { href: "/staff/shopify", label: "Shopify" },
  { href: "/staff/users", label: "Users" },
];

function NavLink({
  href,
  children,
  onClick,
  badge,
  badgeCount,
  highlight,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  badge?: boolean;
  badgeCount?: number;
  highlight?: boolean;
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
        "text-sm px-3 py-2 rounded-md transition block relative",
        active
          ? "bg-neutral-900 text-white"
          : highlight
          ? "bg-blue-600 text-white hover:bg-blue-700 font-medium"
          : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100",
      ].join(" ")}
    >
      {children}
      {badge && badgeCount !== undefined && badgeCount > 0 && (
        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-medium">
          {badgeCount}
        </span>
      )}
    </a>
  );
}

interface Location {
  id: string;
  name: string;
  code: string;
}

export default function StaffTopbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const router = useRouter();

  // Keyboard shortcut for search (Cmd/Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        router.push("/staff/search");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  // Fetch location context
  useEffect(() => {
    async function loadLocation() {
      try {
        const res = await fetch("/staff/api/location/current");
        if (res.ok) {
          const data = await res.json();
          setCurrentLocation(data.currentLocation);
          setAvailableLocations(data.availableLocations || []);
          setIsAdmin(data.isAdmin || false);
        }
      } catch (e) {
        // Silently fail
      }
    }

    loadLocation();
  }, []);

  // Fetch unread message count
  useEffect(() => {
    async function loadUnreadCount() {
      try {
        const res = await fetch("/staff/api/messages/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch (e) {
        // Silently fail
      }
    }

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleLocationChange = async (locationId: string) => {
    try {
      const res = await fetch("/staff/api/location/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentLocation(data.location);
        setShowLocationMenu(false);
        // Reload page to refresh filtered data
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to change location:", e);
    }
  };

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
                <NavLink
                  key={link.href}
                  href={link.href}
                  badge={link.badge}
                  badgeCount={link.badge ? unreadCount : undefined}
                  highlight={link.highlight}
                >
                  {link.label}
                  {link.shortcut && (
                    <span className="ml-2 text-xs text-neutral-400">
                      {link.shortcut}
                    </span>
                  )}
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

        {/* Second row: Location selector (admin) and Logout button */}
        <div className="flex items-center justify-between pb-3 border-t border-neutral-100 pt-2">
          <div className="flex items-center gap-3">
            {isAdmin && currentLocation && availableLocations.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowLocationMenu(!showLocationMenu);
                  }}
                  className="text-sm rounded-xl border border-neutral-300 text-neutral-800 px-4 py-2 hover:bg-neutral-100 whitespace-nowrap font-medium flex items-center gap-2"
                >
                  <span className="text-neutral-600">Location:</span>
                  <span className="font-semibold">{currentLocation.name} ({currentLocation.code})</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showLocationMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 min-w-[200px]">
                    {availableLocations.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => handleLocationChange(loc.id)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 first:rounded-t-lg last:rounded-b-lg ${
                        loc.id === currentLocation.id
                          ? "bg-neutral-100 font-medium"
                          : ""
                      }`}
                      >
                        {loc.name} ({loc.code})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isAdmin && currentLocation && availableLocations.length === 1 && (
              <div className="text-sm text-neutral-600">
                {currentLocation.name} ({currentLocation.code})
              </div>
            )}
            {!isAdmin && currentLocation && (
              <div className="text-sm text-neutral-600">
                {currentLocation.name} ({currentLocation.code})
              </div>
            )}
          </div>

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
                badge={link.badge}
                badgeCount={link.badge ? unreadCount : undefined}
                highlight={link.highlight}
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
