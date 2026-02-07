"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const RESTORATION_IMAGES = [
  { src: "/restoration/1.jpg", alt: "Restored photograph example 1" },
  { src: "/restoration/2.png", alt: "Restored photograph example 2" },
  { src: "/restoration/3.png", alt: "Restored photograph example 3" },
  { src: "/restoration/4.png", alt: "Restored photograph example 4" },
  { src: "/restoration/5.png", alt: "Restored photograph example 5" },
  { src: "/restoration/6.jpg", alt: "Restored photograph example 6" },
];

export default function RestorationPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-32 pb-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4"
          >
            Repair &amp; <span className="text-gold">Restoration</span>
          </motion.h1>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-4">
            West Roxbury Framing offers a full array of repair and restoration services. We can provide initial treatment for photographs and memorabilia suffering from a wide range of damage that requires repair.
          </p>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            We specialize in photo repair services, digital photo repair and antique photo restoration. From breathing life into a cherished family heirloom or restoring water or fire-damaged photos, it would be a privilege to restore and preserve your photographs.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl font-bold text-foreground text-center mb-4"
          >
            Restoration <span className="text-gold">Examples</span>
          </motion.h2>
          <p className="text-muted-foreground text-sm text-center max-w-2xl mx-auto mb-10">
            A small sample of photographs and artwork we have restored and preserved for our clients.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {RESTORATION_IMAGES.map((img) => (
              <div key={img.src} className="overflow-hidden rounded-sm border border-border bg-card">
                <div className="relative aspect-[4/3] bg-muted">
                  <Image src={img.src} alt={img.alt} fill className="object-contain" sizes="(max-width: 640px) 100vw, 50vw" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
