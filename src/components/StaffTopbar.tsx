"use client";

import { usePathname } from "next/navigation";

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
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a
            className="font-semibold text-neutral-900"
            href="/"
          >
            West Roxbury Framing
          </a>

          <nav className="flex gap-2">
            <NavLink href="/staff/orders">Orders</NavLink>
            <NavLink href="/staff/orders/new">New order</NavLink>
            <NavLink href="/staff/customers">Customers</NavLink>
          </nav>
        </div>

        <form action="/staff/api/auth/logout" method="post">
          <button className="text-sm rounded-xl border border-neutral-300 px-3 py-2 hover:bg-neutral-50">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
