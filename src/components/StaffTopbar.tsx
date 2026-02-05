"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const active =
    pathname === href ||
    (href !== "/staff/orders" && pathname.startsWith(href)) ||
    (href === "/staff/orders" && pathname.startsWith("/staff/orders"));

  return (
    <a
      href={href}
      className={[
        "text-sm px-2 py-1 rounded-md transition",
        active
          ? "bg-neutral-900 text-white"
          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100",
      ].join(" ")}
    >
      {children}
    </a>
  );
}

export default function StaffTopbar() {
  return (
    <header className="border-b border-neutral-800 bg-black/95">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="West Roxbury Framing"
              width={140}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>

          <nav className="flex gap-2 text-neutral-200">
            <NavLink href="/staff/orders">Orders</NavLink>
            <NavLink href="/staff/orders/new">New order</NavLink>
            <NavLink href="/staff/customers">Customers</NavLink>
          </nav>
        </div>

        <form action="/staff/api/auth/logout" method="post">
          <button className="text-sm rounded-xl border border-neutral-700 text-neutral-100 px-3 py-2 hover:bg-neutral-900">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
