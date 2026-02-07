"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const TIPS = [
  { title: "Make Sure The Frame Matches The Photo And The Room", body: "A great frame should feel like it belongs to both the artwork and the space it lives in. We help you balance style, era, and materials so your framed art looks intentional in any room in Boston.", img: "/framed-art/01.jpg", alt: "Person considering frame options in front of artwork" },
  { title: "Consider The Size", body: "The wrong scale can make even the best artwork feel out of place. We look at wall size, viewing distance, and surrounding pieces to recommend frame and mat sizes that feel perfectly proportioned.", img: "/framed-art/02.jpg", alt: "Gallery professional adjusting framed artwork on wall" },
  { title: "Consider Colors", body: "Color choices in your frame and mat can either quietly support the art or make a bold statement. We guide you through neutrals, metals, woods, and accent tones so the colors enhance rather than compete.", img: "/framed-art/03.jpg", alt: "Person observing framed artwork in a gallery" },
  { title: "Choose Whether You Want A Mat Board", body: "Mat boards create breathing room around your art, protect it from the glass, and can completely change the look of a piece. From clean white to layered museum-style mats, we'll help you decide what fits your artwork and your taste.", img: "/framed-art/04.jpg", alt: "Hands positioning an empty picture frame on a tabletop" },
];

const FRAMED_GALLERY = [
  { src: "/framed-art/01.webp", alt: "Custom framed sports memorabilia collage" },
  { src: "/framed-art/02.webp", alt: "Framed photograph with Boston Celtics logo" },
  { src: "/framed-art/04.webp", alt: "Framed Bruins poster with mat and logo" },
  { src: "/framed-art/05.webp", alt: "Framed ballerina painting with gold frame" },
  { src: "/framed-art/06.webp", alt: "Large framed colorful artwork" },
  { src: "/framed-art/07.webp", alt: "Framed Roslindale map art" },
  { src: "/framed-art/08.webp", alt: "Framed western landscape artwork" },
  { src: "/framed-art/brady-jersey.webp", alt: "Framed Tom Brady Patriots jersey" },
  { src: "/framed-art/vintage-flag-large.webp", alt: "Large framed American flag" },
  { src: "/framed-art/ems-patches-collage.webp", alt: "Framed EMS patches and numbers collage" },
  { src: "/framed-art/lighthouse-tapestry.webp", alt: "Framed lighthouse and nautical tapestry" },
  { src: "/framed-art/diploma-and-medal.webp", alt: "Framed diploma with medal on red mat" },
  { src: "/framed-art/cowboy-sunset.webp", alt: "Framed painting of cowboy on horse at sunset" },
  { src: "/framed-art/shop-owner-portrait.webp", alt: "Framer standing next to large framed artwork in shop" },
  { src: "/framed-art/honor-certificate.webp", alt: "Framed honor certificate with decorative border and medallion" },
];

export default function FramedArtPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-32 pb-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4">
            Framed <span className="text-gold">Art</span>
          </motion.h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Choose the right frame in Boston. Taking time to choose the perfect frame might not seem like a high priority, but if you care enough to put a picture on the wall, make an effort to select a frame that makes it even better. Consider the piece itself and where the frame will live.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          {TIPS.map((tip, i) => (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid gap-8 md:grid-cols-2 items-center bg-card p-8 rounded-sm border border-border"
            >
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <h2 className="font-serif text-2xl text-foreground mb-3">{tip.title}</h2>
                <p className="text-foreground/70 leading-relaxed text-sm">{tip.body}</p>
              </div>
              <div className={`relative aspect-[16/9] overflow-hidden rounded-sm ${i % 2 === 1 ? "md:order-1" : ""}`}>
                <Image src={tip.img} alt={tip.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-serif text-3xl font-bold text-foreground mb-4">
            Framed Art <span className="text-gold">Examples</span>
          </motion.h2>
          <p className="text-muted-foreground text-sm mb-10">A selection of jerseys, flags, diplomas, artwork, and memorabilia we have custom framed.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FRAMED_GALLERY.map((img) => (
              <div key={img.src} className="overflow-hidden rounded-sm border border-border bg-card">
                <div className="relative aspect-[4/5]">
                  <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
