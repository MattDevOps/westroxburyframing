import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { sendTestimonialsDownAlert } from "@/lib/email";

// Throttle the staff alert. This route runs on many page loads and a failing
// Google call (e.g. REQUEST_DENIED) returns HTTP 200, so the failure can recur
// often. Alert at most once per window per server instance, and only in
// production (dev surfaces the reason via the `debug` field instead).
const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours
let lastAlertAt = 0;

function alertReviewsDown(status: string, detail: string) {
  if (process.env.NODE_ENV !== "production") return;
  const now = Date.now();
  if (now - lastAlertAt < ALERT_COOLDOWN_MS) return;
  lastAlertAt = now;
  // Fire-and-forget: a failed/slow alert must never block or break the page.
  void sendTestimonialsDownAlert({ status, detail }).catch((e) =>
    console.error("Testimonials-down alert failed to send", e),
  );
}

// Curated fallback shown whenever live Google data is unavailable (keys not
// set, billing off, quota exceeded, or zero reviews returned) so the public
// testimonials page never renders a broken/error state.
const FALLBACK = {
  source: "static" as const,
  rating: 5,
  total: 100,
  reviews: [
    {
      author_name: "Sarah M.",
      rating: 5,
      relative_time_description: "Recently",
      text:
        "Fantastic framing shop. Moses and the team treated my artwork like it was their own and the final result was perfect.",
    },
    {
      author_name: "Jonathan R.",
      rating: 5,
      relative_time_description: "Recently",
      text:
        "Brought in an old family photo that was badly faded and they brought it back to life. The new frame looks incredible.",
    },
    {
      author_name: "Emily K.",
      rating: 5,
      relative_time_description: "Recently",
      text:
        "Super helpful with picking mats and glass. Turnaround was fast and the price was very fair for the quality.",
    },
    {
      author_name: "Michael D.",
      rating: 5,
      relative_time_description: "Recently",
      text:
        "Have used West Roxbury Framing for jerseys, diplomas, and artwork. Every single piece has come out perfect.",
    },
    {
      author_name: "Lindsey P.",
      rating: 5,
      relative_time_description: "Recently",
      text:
        "Moses is a true professional. He walked me through options and never rushed the process. Couldn't be happier.",
    },
    {
      author_name: "Chris S.",
      rating: 5,
      relative_time_description: "Recently",
      text:
        "Five stars all around. Friendly, knowledgeable, and the finished frame completely transformed my print.",
    },
  ],
};

export async function GET() {
  try {
    if (!env.GOOGLE_PLACES_API_KEY || !env.GOOGLE_PLACES_PLACE_ID) {
      // Keys not configured yet — serve the curated fallback.
      return NextResponse.json(FALLBACK);
    }

    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", env.GOOGLE_PLACES_PLACE_ID);
    url.searchParams.set("fields", "rating,user_ratings_total,reviews");
    url.searchParams.set("reviews_sort", "newest");
    url.searchParams.set("language", "en");
    url.searchParams.set("key", env.GOOGLE_PLACES_API_KEY);

    const res = await fetch(url.toString(), {
      // Cache for 1 hour to avoid hitting rate limits unnecessarily
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Google Places API HTTP error", res.status, body);
      alertReviewsDown(`HTTP ${res.status}`, body.slice(0, 300));
      return NextResponse.json(FALLBACK);
    }

    const data = await res.json();

    // Google Places returns HTTP 200 even for API/key/billing errors.
    // See: https://developers.google.com/maps/documentation/places/web-service/details#PlaceDetailsStatusCodes
    if (data?.status && data.status !== "OK") {
      const msg = data.error_message || "";
      console.error("Google Places API non-OK status", data.status, msg);
      alertReviewsDown(data.status, msg);
      // Serve the fallback so the public page still looks good; surface the
      // real reason in dev so the owner can fix key/billing/restrictions.
      return NextResponse.json(
        process.env.NODE_ENV === "development" && msg
          ? { ...FALLBACK, debug: `Google: ${data.status} - ${msg}` }
          : FALLBACK,
      );
    }

    const result = data.result || {};
    const reviews = Array.isArray(result.reviews) ? result.reviews : [];

    // If Google returns no reviews, keep its real rating/total but use the
    // curated review cards so the page isn't blank.
    if (reviews.length === 0) {
      return NextResponse.json({
        ...FALLBACK,
        rating: result.rating ?? FALLBACK.rating,
        total: result.user_ratings_total ?? FALLBACK.total,
      });
    }

    return NextResponse.json({
      source: "google",
      rating: result.rating,
      total: result.user_ratings_total,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching testimonials", error);
    alertReviewsDown("fetch_error", error instanceof Error ? error.message : String(error));
    return NextResponse.json(FALLBACK);
  }
}
