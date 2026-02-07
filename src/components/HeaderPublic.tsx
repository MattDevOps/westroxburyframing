"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "About Us", path: "/about" },
  { name: "Services", path: "/services" },
  { name: "Framed Art", path: "/framed-art" },
  { name: "Repair & Restoration", path: "/restoration" },
  { name: "Testimonials", path: "/testimonials" },
  { name: "Contact Us", path: "/contact" },
];

export default function HeaderPublic() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="West Roxbury Framing"
            width={180}
            height={72}
            className="h-14 md:h-16 w-auto object-contain"
            priority
          />
          <span className="sr-only">West Roxbury Framing</span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`text-sm font-medium tracking-wide uppercase transition-colors hover:text-gold ${
                pathname === link.path
                  ? "text-gold border-b border-gold pb-0.5"
                  : "text-foreground/70"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/book"
            className="ml-2 px-5 py-2.5 bg-gold text-primary-foreground text-sm font-semibold tracking-wide uppercase rounded-sm hover:opacity-90 transition-colors"
          >
            Book
          </Link>
        </div>

        <button
          className="lg:hidden text-foreground"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm font-medium tracking-wide uppercase transition-colors hover:text-gold ${
                    pathname === link.path ? "text-gold" : "text-foreground/70"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/book"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 bg-gold text-primary-foreground text-sm font-semibold tracking-wide uppercase rounded-sm text-center"
              >
                Book
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
