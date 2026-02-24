"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const RESTORATION_IMAGES = [
  { src: "/restoration/1.jpg", alt: "Restored antique photograph — before and after restoration in West Roxbury" },
  { src: "/restoration/2.png", alt: "Damaged photo restored — digital photo repair service" },
  { src: "/restoration/3.png", alt: "Faded family photograph brought back to life" },
  { src: "/restoration/4.png", alt: "Antique portrait photo restoration example" },
  { src: "/restoration/5.png", alt: "Water-damaged photograph repaired and restored" },
  { src: "/restoration/6.jpg", alt: "Old photograph restored to display-ready condition" },
];

export default function RestorationContent() {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-32 pb-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4"
          >
            Photo &amp; Frame <span className="text-gold">Restoration</span>
          </motion.h1>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-4 text-lg leading-relaxed">
            West Roxbury Framing offers professional photo repair and frame restoration services.
            We carefully restore old, damaged, or faded photographs and frames — bringing cherished
            memories back to life so they can be displayed and enjoyed for generations.
          </p>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We specialize in digital photo repair, antique photo restoration, frame refinishing,
            and structural frame repair. Whether your piece has water damage, tears, discoloration,
            fire damage, or a broken frame — bring it in for a free assessment.
          </p>
        </div>
      </section>

      {/* What We Restore */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl font-bold text-foreground text-center mb-12"
          >
            What We <span className="text-gold">Restore</span>
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Faded Photographs", desc: "Digital restoration to bring back color, contrast, and sharpness to old or sun-bleached photos." },
              { title: "Torn or Creased Photos", desc: "Careful repair of rips, tears, creases, and missing sections using digital reconstruction." },
              { title: "Water & Fire Damage", desc: "Restoration of photographs and frames damaged by water, smoke, or fire — salvaging what matters most." },
              { title: "Antique Photos", desc: "Gentle restoration of century-old family portraits, tintypes, and vintage prints while preserving their character." },
              { title: "Broken Frames", desc: "Structural repair of cracked, chipped, or broken frames. We can also refinish, repaint, or re-gild existing frames." },
              { title: "Insurance Claims", desc: "We work with insurance providers to restore or replace damaged framed pieces. Free assessments and itemized estimates." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card p-6 rounded-sm border border-border"
              >
                <h3 className="font-serif text-lg text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
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
            className="font-serif text-3xl font-bold text-foreground text-center mb-4"
          >
            Restoration <span className="text-gold">Examples</span>
          </motion.h2>
          <p className="text-muted-foreground text-sm text-center max-w-2xl mx-auto mb-10">
            A sample of photographs and artwork we have restored for clients across Boston and the surrounding area.
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

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
            Have a Piece That Needs <span className="text-gold">Restoring</span>?
          </h2>
          <p className="text-muted-foreground mb-8">
            Bring it in for a free assessment. We'll evaluate the damage and give you an honest recommendation
            and quote — no obligation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="px-8 py-3.5 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:opacity-90 transition-colors"
            >
              Book a Consultation
            </Link>
            <a
              href="tel:16173273890"
              className="px-8 py-3.5 border border-gold text-gold font-semibold tracking-wide uppercase text-sm rounded-sm hover:bg-gold hover:text-primary-foreground transition-colors"
            >
              Call (617) 327-3890
            </a>
          </div>
          <p className="mt-6 text-muted-foreground text-sm">
            1741 Centre Street, West Roxbury, MA 02132 · Free parking · Walk-ins welcome
          </p>
        </div>
      </section>
    </div>
  );
}
