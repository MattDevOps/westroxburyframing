import Image from "next/image";
import Link from "next/link";

export default function HeaderPublic() {
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
        <nav className="flex gap-4 text-sm text-neutral-200">
          <a href="/framed-art">Framed Art</a>
          <a href="/services">Services</a>
          <a href="/restoration">Repair &amp; Restoration</a>
          <a href="/about">About</a>
          <a href="/book" className="font-medium text-white">
            Book
          </a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </header>
  );
}
