import { NextResponse } from "next/server";

// Curated testimonials served on the public testimonials page. We deliberately
// do NOT call the live Google Places API: that requires billing enabled on the
// Google Cloud project, and the owner prefers to keep these curated reviews
// rather than pay for the live feed. Because there is no live call, there is
// nothing to fail and no "testimonials down" alert to send.
const REVIEWS = {
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
  return NextResponse.json(REVIEWS);
}
