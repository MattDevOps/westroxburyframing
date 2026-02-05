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
            author_name: "Google Reviewer",
            rating: 5,
            relative_time_description: "Recently",
            text:
              "Fantastic framing shop. Moses and the team treated my artwork like it was their own and the final result was perfect.",
          },
        ],
      });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", env.GOOGLE_PLACES_PLACE_ID);
    url.searchParams.set("fields", "rating,user_ratings_total,reviews");
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

    const result = data.result || {};
    const reviews = Array.isArray(result.reviews) ? result.reviews : [];

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

