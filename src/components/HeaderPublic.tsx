 "use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HeaderPublic() {
  const pathname = usePathname();

  const linkBase =
    "transition-colors hover:text-white";

  const activeClass =
    "text-white border-b border-white pb-0.5";

  function linkClass(path: string, extra?: string) {
    const isActive =
      path === "/"
        ? pathname === "/"
        : pathname === path || pathname.startsWith(path + "/");
    return [
      linkBase,
      extra,
      isActive ? activeClass : "text-neutral-200",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return (
    <header className="border-b border-neutral-800 bg-black/95">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="West Roxbury Framing"
            width={180}
            height={60}
            className="h-14 w-auto"
            priority
          />
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>
          <Link href="/framed-art" className={linkClass("/framed-art")}>
            Framed Art
          </Link>
          <Link href="/services" className={linkClass("/services")}>
            Services
          </Link>
          <Link href="/testimonials" className={linkClass("/testimonials")}>
            Testimonials
          </Link>
          <Link href="/restoration" className={linkClass("/restoration")}>
            Repair &amp; Restoration
          </Link>
          <Link href="/about" className={linkClass("/about")}>
            About
          </Link>
          <Link
            href="/book"
            className={linkClass(
              "/book",
              "font-medium"
            )}
          >
            Book
          </Link>
          <Link href="/contact" className={linkClass("/contact")}>
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
