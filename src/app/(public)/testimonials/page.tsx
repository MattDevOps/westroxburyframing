"use client";

import { useEffect, useState } from "react";

type Review = {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description?: string;
};

type TestimonialsResponse =
  | {
      source: string;
      rating: number;
      total: number;
      reviews: Review[];
      error?: undefined;
    }
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
        if (!cancelled) {
          setData({ error: "Unable to load testimonials at this time." });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const reviews =
    data && "reviews" in data && Array.isArray((data as any).reviews)
      ? (data as any).reviews.slice(0, 12)
      : [];

  const rating = data && "rating" in data ? (data as any).rating : 5;
  const total = data && "total" in data ? (data as any).total : 100;

  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Testimonials</h1>
        <p className="max-w-3xl mx-auto text-neutral-700">
          We&apos;re proud to have earned{" "}
          <span className="font-semibold">100+ five-star Google reviews</span> from customers who trust us
          with their art, photos, diplomas, and memorabilia.
        </p>
        <p className="text-sm text-neutral-600">
          These reviews are pulled directly from our Google Business profile.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-amber-700">
          <span className="text-lg">★</span>
          <span className="font-semibold">
            {rating?.toFixed ? rating.toFixed(1) : rating} / 5.0
          </span>
          <span className="text-neutral-500">({total}+ reviews)</span>
        </div>
      </header>

      {loading && (
        <div className="text-center text-neutral-600 text-sm">Loading reviews…</div>
      )}

      {!loading && data && "error" in data && (
        <div className="text-center text-sm text-red-600">{data.error}</div>
      )}

      {!loading && reviews.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2">
          {reviews.map((r, idx) => (
            <article
              key={`${r.author_name}-${idx}`}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    {r.author_name || "Google Reviewer"}
                  </div>
                  {r.relative_time_description && (
                    <div className="text-xs text-neutral-500">{r.relative_time_description}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-amber-600 text-xs">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < Math.round(r.rating ?? 5) ? "★" : "☆"}</span>
                  ))}
                </div>
              </div>
              <p className="text-sm leading-6 text-neutral-700 whitespace-pre-wrap">
                {r.text || "No review text provided."}
              </p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

