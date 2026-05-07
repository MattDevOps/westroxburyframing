"use client";

import { Star } from "lucide-react";
import Image from "next/image";

const GOOGLE_REVIEW_URL =
  "https://www.google.com/maps/place/West+Roxbury+Framing/@42.287442,-71.150185,17z/data=!4m8!3m7!1s0x89e37f2bfd283b73:0x4cbd8e522909889e!8m2!3d42.287442!4d-71.150185!9m1!1b1!16s%2Fg%2F1thp03vg";

export default function ReviewContent() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-24">
      <div className="max-w-md w-full text-center space-y-8">
        <Image
          src="/logo.png"
          alt="West Roxbury Framing"
          width={200}
          height={80}
          className="mx-auto h-16 w-auto"
        />

        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-3">
            Thank You!
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            We hope you love your framing. If you have a moment, we&apos;d
            appreciate a quick review — it helps our small family business more
            than you know.
          </p>
        </div>

        <div className="flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={32}
              className="text-gold fill-gold"
            />
          ))}
        </div>

        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full px-8 py-4 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:opacity-90 transition-colors"
        >
          Leave a Google Review
        </a>

        <p className="text-muted-foreground text-xs">
          You&apos;ll be taken to Google Maps to write your review.
          <br />
          Thank you for supporting West Roxbury Framing!
        </p>
      </div>
    </div>
  );
}
