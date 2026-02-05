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
            width={140}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </Link>
        <nav className="flex gap-4 text-sm text-neutral-200">
          <a href="/custom-framing">Custom Framing</a>
          <a href="/framed-art">Framed Art</a>
          <a href="/services">Services</a>
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
