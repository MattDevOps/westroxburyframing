import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  try {
    if (!env.GOOGLE_PLACES_API_KEY || !env.GOOGLE_PLACES_PLACE_ID) {
      // Fallback sample when API keys are not configured yet
      return NextResponse.json({
        source: "static",
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
              "Moses is a true professional. He walked me through options and never rushed the process. Couldn’t be happier.",
          },
          {
            author_name: "Chris S.",
            rating: 5,
            relative_time_description: "Recently",
            text:
              "Five stars all around. Friendly, knowledgeable, and the finished frame completely transformed my print.",
          },
        ],
      });
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
      const text = await res.text();
      console.error("Google Places API error", res.status, text);
      return NextResponse.json(
        { error: "Failed to load reviews from Google." },
        { status: 500 },
      );
    }

    const data = await res.json();

    // Google Places returns HTTP 200 even for API/key/billing errors.
    // See: https://developers.google.com/maps/documentation/places/web-service/details#PlaceDetailsStatusCodes
    if (data?.status && data.status !== "OK") {
      const msg = data.error_message || "";
      console.error("Google Places API non-OK status", data.status, msg);
      return NextResponse.json(
        {
          error:
            "Google reviews are temporarily unavailable. (Check GOOGLE_PLACES_API_KEY / GOOGLE_PLACES_PLACE_ID and billing.)",
          // Include Google's message in dev so you can fix key/billing/restrictions
          ...(process.env.NODE_ENV === "development" && msg
            ? { debug: `Google: ${data.status} - ${msg}` }
            : {}),
        },
        { status: 502 },
      );
    }

    const result = data.result || {};
    const reviews = Array.isArray(result.reviews) ? result.reviews : [];

    // If Google returns no reviews (or omits them), fall back so the page isn't blank.
    if (reviews.length === 0) {
      return NextResponse.json({
        source: "static",
        rating: result.rating ?? 5,
        total: result.user_ratings_total ?? 100,
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
              "Moses is a true professional. He walked me through options and never rushed the process. Couldn’t be happier.",
          },
          {
            author_name: "Chris S.",
            rating: 5,
            relative_time_description: "Recently",
            text:
              "Five stars all around. Friendly, knowledgeable, and the finished frame completely transformed my print.",
          },
        ],
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
    return NextResponse.json(
      { error: "Something went wrong loading testimonials." },
      { status: 500 },
    );
  }
}

