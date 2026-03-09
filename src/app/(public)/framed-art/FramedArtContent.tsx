"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const SERVICES = [
  "Custom Frames",
  "Mat Cutting",
  "Glass & Glazing",
  "Backing & Mounting",
  "Shadow Boxes",
  "Canvas Stretching",
  "Jersey & Memorabilia Framing",
  "Restoration & Repair",
];

const FALLBACK_GALLERY = [
  { src: "/framed-art/01.webp", alt: "Custom framed sports memorabilia collage — West Roxbury Framing" },
  { src: "/framed-art/02.webp", alt: "Framed photograph with Boston Celtics logo — custom sports framing" },
  { src: "/framed-art/04.webp", alt: "Framed Bruins poster with custom mat and logo cutout" },
  { src: "/framed-art/05.webp", alt: "Framed ballerina painting with gold frame — fine art framing" },
  { src: "/framed-art/06.webp", alt: "Large framed colorful artwork — custom picture framing Boston" },
  { src: "/framed-art/07.webp", alt: "Framed Roslindale map art — neighborhood art framing" },
  { src: "/framed-art/08.webp", alt: "Framed western landscape artwork" },
  { src: "/framed-art/brady-jersey.webp", alt: "Custom shadow box framed Tom Brady Patriots jersey" },
  { src: "/framed-art/vintage-flag-large.webp", alt: "Large framed American flag — flag framing West Roxbury" },
  { src: "/framed-art/ems-patches-collage.webp", alt: "Framed EMS patches and numbers collage — shadow box" },
  { src: "/framed-art/lighthouse-tapestry.webp", alt: "Framed lighthouse and nautical tapestry" },
  { src: "/framed-art/diploma-and-medal.webp", alt: "Framed diploma with medal on red mat — diploma framing Boston" },
  { src: "/framed-art/cowboy-sunset.webp", alt: "Framed painting of cowboy on horse at sunset" },
  { src: "/framed-art/shop-owner-portrait.webp", alt: "Moses Hasson — owner of West Roxbury Framing — standing next to large custom framed artwork" },
  { src: "/framed-art/honor-certificate.webp", alt: "Framed honor certificate with decorative border and medallion" },
];

interface GalleryItem {
  id: string;
  title: string | null;
  description: string | null;
  category: string;
  imageUrl: string;
}

export default function FramedArtContent() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[] | null>(null);

  useEffect(() => {
    fetch("/api/public/gallery")
      .then((r) => r.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          setGalleryItems(data.items);
        }
      })
      .catch(() => {
        // Use fallback
      });
  }, []);

  const gallery = galleryItems
    ? galleryItems.map((item) => ({
        src: item.imageUrl,
        alt: item.title || item.description || "Custom framed artwork by West Roxbury Framing",
        title: item.title,
        description: item.description,
      }))
    : FALLBACK_GALLERY.map((item) => ({
        ...item,
        title: null as string | null,
        description: null as string | null,
      }));

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-32 pb-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4"
          >
            Our <span className="text-gold">Work</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed"
          >
            From jerseys and diplomas to fine art and family heirlooms — we handle
            every detail of the custom framing process so your piece looks its absolute best.
          </motion.p>
        </div>
      </section>

      {/* Services strip */}
      <section className="py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {SERVICES.map((s, i) => (
              <motion.span
                key={s}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="text-sm tracking-wide text-foreground/80 uppercase"
              >
                {s}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl font-bold text-foreground mb-2"
          >
            Recent <span className="text-gold">Projects</span>
          </motion.h2>
          <p className="text-muted-foreground text-sm mb-10">
            Jerseys, flags, diplomas, fine art, memorabilia, and more — all custom framed in our West Roxbury shop.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((img) => (
              <div key={img.src} className="overflow-hidden rounded-sm border border-border bg-card group">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized={img.src.startsWith("http")}
                  />
                </div>
                {(img.title || img.description) && (
                  <div className="p-4">
                    {img.title && (
                      <h3 className="text-sm font-medium text-foreground">{img.title}</h3>
                    )}
                    {img.description && (
                      <p className="text-xs text-muted-foreground mt-1">{img.description}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
            Ready to Get <span className="text-gold">Started</span>?
          </h2>
          <p className="text-muted-foreground mb-8">
            Bring your piece in or book a consultation — we&apos;ll take care of the rest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="px-8 py-3 bg-gold text-background font-semibold text-sm tracking-wider uppercase hover:bg-gold/90 transition-colors rounded-sm"
            >
              Book a Consultation
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 border border-border text-foreground font-semibold text-sm tracking-wider uppercase hover:border-gold/50 transition-colors rounded-sm"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
