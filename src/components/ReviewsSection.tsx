import { SITE } from "@/lib/site";

const REVIEWS = [
  {
    name: "Joseph M.",
    text: "Great local, family run business. The prices are fair, the work is high quality and completed in a week or two.",
  },
  {
    name: "Terrance M.",
    text: "My go-to frame store in Boston. Great people and their selection and prices are second to none.",
  },
  {
    name: "Matthew N.",
    text: "Incredible shop that knows their stuff and has the best prices I’ve come across.",
  },
];

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <div className="flex items-center gap-1" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < full ? "text-amber-300" : "text-neutral-600"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-neutral-400">Trusted by locals in West Roxbury</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Google Reviews</h2>

          <div className="mt-3 flex items-center gap-3 text-neutral-200">
            <Stars value={SITE.ratingValue} />
            <div className="text-sm">
              <span className="font-semibold">{SITE.ratingValue.toFixed(1)}</span> / 5 ·{" "}
              <span className="font-semibold">{SITE.ratingCount}+</span> reviews
            </div>
          </div>
        </div>

        <a
          href={SITE.googleReviewsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
        >
          Read all reviews
        </a>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {REVIEWS.map((r) => (
          <div key={r.name} className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-5">
            <div className="text-sm text-neutral-400">{r.name}</div>
            <p className="mt-2 text-neutral-200 leading-relaxed">“{r.text}”</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-neutral-500">
        Reviews shown are curated excerpts. Full review history is available on Google.
      </p>
    </section>
  );
}
