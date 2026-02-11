"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

type Review = {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description?: string;
};

type TestimonialsResponse =
  | { source: string; rating: number; total: number; reviews: Review[] }
  | { error: string };

export default function TestimonialsPage() {
  const [data, setData] = useState<TestimonialsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/testimonials", { cache: "no-store" });
        const json = (await res.json()) as TestimonialsResponse;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setData({ error: "Unable to load testimonials at this time." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const reviews = data && "reviews" in data && Array.isArray(data.reviews) ? data.reviews.slice(0, 12) : [];
  const rating = data && "rating" in data ? (data as any).rating : 5;
  const total = data && "total" in data ? (data as any).total : 100;

  return (
    <div className="min-h-screen bg-background">
      <section className="pt-32 pb-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4"
          >
            Testimonials
          </motion.h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-2">
            We&apos;re proud to have earned 100+ five-star Google reviews from customers who trust us with their art, photos, diplomas, and memorabilia.
          </p>
          <p className="text-sm text-muted-foreground">
            These reviews are pulled directly from our Google Business profile.{" "}
            <a
              href="https://www.google.com/maps/place/West+Roxbury+Framing/@42.287442,-71.150185/data=!3m1!4b1!4m6!3m5!1s0x89e37f2bfd283b73:0x4cbd8e522909889e!8m2!3d42.287442!4d-71.150185!16s%2Fg%2F11c0vx8x1h?entry=ttu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:text-gold-light underline underline-offset-2"
            >
              View all reviews directly from our Google page →
            </a>
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gold mt-4">
            <Star size={18} className="fill-gold" />
            <span className="font-semibold">{typeof rating === "number" ? rating.toFixed(1) : rating} / 5.0</span>
            <span className="text-muted-foreground">({total}+ reviews)</span>
          </div>
        </div>
      </section>

      {loading && <div className="text-center text-muted-foreground text-sm py-12">Loading reviews…</div>}
      {!loading && data && "error" in data && (
        <div className="text-center text-sm py-12 space-y-2">
          <p className="text-red-400">{data.error}</p>
          {"debug" in data && (data as { debug?: string }).debug && (
            <p className="text-muted-foreground font-mono text-xs max-w-xl mx-auto">{(data as { debug: string }).debug}</p>
          )}
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((r, i) => (
              <motion.article
                key={`${r.author_name}-${i}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card p-8 rounded-sm border border-border"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} className={j < Math.round(r.rating ?? 5) ? "fill-gold text-gold" : "text-gold/30"} />
                  ))}
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed mb-6 italic">&quot;{r.text || "No review text provided."}&quot;</p>
                <p className="text-gold font-semibold text-sm">{r.author_name || "Google Reviewer"}</p>
                {r.relative_time_description && <p className="text-muted-foreground text-xs mt-1">{r.relative_time_description}</p>}
              </motion.article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
