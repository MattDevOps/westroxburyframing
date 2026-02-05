"use client";

import Image from "next/image";
import { useRef } from "react";

const IMAGES = [
  { src: "/framed-art/brady-jersey.webp", alt: "Framed Patriots jersey" },
  { src: "/framed-art/ems-patches-collage.webp", alt: "Framed EMS patches collage" },
  { src: "/framed-art/cowboy-sunset.webp", alt: "Framed western painting at sunset" },
  { src: "/framed-art/diploma-and-medal.webp", alt: "Framed diploma with medal" },
  { src: "/framed-art/lighthouse-tapestry.webp", alt: "Framed lighthouse tapestry" },
  { src: "/restoration/1.jpg", alt: "Restored photograph example" },
];

export default function HomeGalleryStrip() {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  function scroll(direction: "left" | "right") {
    const container = scrollRef.current;
    if (!container) return;
    const amount = container.clientWidth * 0.7;
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Discover Gallery</h2>
        <div className="hidden md:flex gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="h-8 w-8 rounded-full border border-white/30 bg-white/10 text-white flex items-center justify-center text-xs hover:bg-white/20"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="h-8 w-8 rounded-full border border-white/30 bg-white/10 text-white flex items-center justify-center text-xs hover:bg-white/20"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-1"
      >
        {IMAGES.map((img) => (
          <div
            key={img.src}
            className="relative h-40 w-64 md:h-52 md:w-80 shrink-0 overflow-hidden rounded-2xl bg-neutral-900/40 shadow-[0_14px_45px_rgba(0,0,0,0.6)]"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 75vw, 40vw"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

