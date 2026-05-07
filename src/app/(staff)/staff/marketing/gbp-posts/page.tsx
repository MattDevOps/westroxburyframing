"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface PostTemplate {
  category: string;
  title: string;
  body: string;
  tip: string;
}

const templates: PostTemplate[] = [
  {
    category: "Before & After",
    title: "Custom Framing Transformation",
    body: `🖼️ Another beautiful transformation at West Roxbury Framing!

[DESCRIBE THE PROJECT — e.g., "This vintage family photo was fading and needed new life. We restored the image, chose a classic walnut frame with double cream matting, and added UV-filtering glass to protect it for generations."]

📍 1741 Centre St, West Roxbury
📞 617-327-3890
🕒 Mon–Fri 9:30–6 | Sun 10:30–4:30
Walk-ins welcome!

#WestRoxburyFraming #CustomFraming #BeforeAndAfter #PictureFraming #Boston`,
    tip: "Post a side-by-side photo of the item before and after framing. These get the highest engagement on Google Business.",
  },
  {
    category: "Project Showcase",
    title: "Featured Framing Project",
    body: `Check out this [TYPE — jersey shadowbox / diploma / artwork / memorabilia] we just finished!

[DESCRIBE what makes it special — materials used, customer's story, etc.]

Whether it's a sports jersey, family photo, diploma, or work of art — we'll help you find the perfect frame.

Get 10% off your first order with code WELCOME10!

📍 1741 Centre St, West Roxbury, MA
📞 617-327-3890

#CustomFraming #WestRoxbury #FrameShop #ShadowBox #Boston`,
    tip: "Post 2–3 high-quality photos showing the finished piece from different angles. Tag the type of framing (jersey, diploma, etc.) in the first line.",
  },
  {
    category: "Seasonal / Holiday",
    title: "Seasonal Promotion",
    body: `🎁 [SEASON/HOLIDAY] is coming! A custom-framed piece makes a meaningful, one-of-a-kind gift.

Popular gift framing ideas:
• Family photos
• Wedding or engagement photos
• Children's artwork
• Sports memorabilia
• Diplomas & certificates

Order by [DATE] to guarantee pickup before [HOLIDAY]!

📍 1741 Centre St, West Roxbury
📞 617-327-3890
Walk-ins welcome — free parking!

#GiftIdeas #CustomFraming #WestRoxbury #Boston #[HOLIDAY]`,
    tip: "Post 4–6 weeks before major holidays (Mother's Day, Father's Day, Christmas, graduation season). Change the date and holiday name each time.",
  },
  {
    category: "Tip / Educational",
    title: "Framing Tip of the Week",
    body: `💡 Framing Tip: [CHOOSE ONE BELOW]

Option A — UV Protection:
"Did you know? Sunlight fades artwork and photos over time. UV-filtering glass blocks 97% of harmful rays. Museum glass goes further — it eliminates reflections too. Ask us which option is right for your piece."

Option B — Mat Selection:
"The right mat makes all the difference. A mat adds breathing room between your art and the glass, draws the eye to the subject, and protects the piece from moisture. We always recommend acid-free matting for anything you want to keep."

Option C — Conservation vs. Standard:
"Standard framing looks great. Conservation framing looks great AND protects your piece for 50+ years. For irreplaceable items — family photos, diplomas, signed memorabilia — the upgrade is worth every penny."

📍 West Roxbury Framing | 1741 Centre St
📞 617-327-3890

#FramingTips #CustomFraming #WestRoxbury #ArtPreservation`,
    tip: "Educational posts build trust and show expertise. Pick one option, post a relevant photo (a piece of UV glass, a matted photo, etc.).",
  },
  {
    category: "Review / Testimonial",
    title: "Customer Review Highlight",
    body: `⭐⭐⭐⭐⭐ Thank you for the kind words!

"[PASTE A RECENT GOOGLE REVIEW HERE]"
— [Customer Name]

We're grateful for every customer who trusts us with their special pieces. Your reviews help our small family business grow!

Have something to frame? Stop by or book a free consultation:
📍 1741 Centre St, West Roxbury
📞 617-327-3890
🔗 westroxburyframing.com/book

#CustomerReview #FiveStars #WestRoxburyFraming #FamilyBusiness #Boston`,
    tip: "Repost a real Google review (with permission if using their full name). This encourages others to leave reviews too. Post a photo of a relevant project if you have one.",
  },
  {
    category: "Community / Award",
    title: "Community Post",
    body: `🏆 Proud to be a 2024 Boston Legacy Business Award recipient!

West Roxbury Framing has been serving the community since 1981 — over 45 years of custom picture framing. Thank you to everyone who has trusted us with your treasured pieces.

From art and photos to jerseys, diplomas, and family heirlooms — we frame what matters to you.

📍 1741 Centre St, West Roxbury, MA 02132
📞 617-327-3890
Walk-ins welcome | Free parking

#BostonLegacyBusiness #WestRoxbury #FamilyBusiness #SupportLocal #Boston`,
    tip: "Use this template for any community involvement — local events, awards, partnerships with local businesses. Include a photo of the team or the shop.",
  },
  {
    category: "Offer / Promotion",
    title: "Special Offer Post",
    body: `🎉 [PROMOTION NAME]!

[DESCRIBE THE OFFER — e.g., "Get 25% off all World Cup memorabilia framing! Jerseys, photos, flags, scarves — professionally framed and preserved."]

Use code [CODE] or mention this post in-store.
Valid through [END DATE].

📍 West Roxbury Framing
1741 Centre St, West Roxbury, MA
📞 617-327-3890
🔗 westroxburyframing.com/book

#SpecialOffer #CustomFraming #WestRoxbury #Boston`,
    tip: "Google Business offer posts appear prominently on your profile. Include a clear expiration date and make the discount specific (% off, $ off, or free upgrade).",
  },
];

export default function GBPPostsPage() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function copyToClipboard(text: string, idx: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Google Business Post Templates
        </h1>
        <p className="text-neutral-500 mt-1">
          Copy a template, customize the bracketed text, and post it to your{" "}
          <a
            href="https://business.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Google Business Profile
          </a>
          . Aim for 1–2 posts per week.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>Quick posting guide:</strong>
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li>
            Go to{" "}
            <a
              href="https://business.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              business.google.com
            </a>
          </li>
          <li>Click &quot;Add update&quot; or &quot;Create post&quot;</li>
          <li>Paste the template text and add 1–3 photos</li>
          <li>Choose &quot;Add button&quot; → &quot;Book&quot; or &quot;Call now&quot;</li>
          <li>Publish!</li>
        </ol>
      </div>

      <div className="space-y-6">
        {templates.map((template, idx) => (
          <div
            key={idx}
            className="border border-neutral-200 rounded-lg overflow-hidden"
          >
            <div className="bg-neutral-50 px-5 py-3 flex items-center justify-between border-b border-neutral-200">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  {template.category}
                </span>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {template.title}
                </h2>
              </div>
              <button
                onClick={() => copyToClipboard(template.body, idx)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                {copiedIdx === idx ? (
                  <>
                    <Check size={16} className="text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="p-5">
              <pre className="whitespace-pre-wrap text-sm text-neutral-700 font-sans leading-relaxed bg-white border border-neutral-100 rounded p-4">
                {template.body}
              </pre>
              <p className="mt-3 text-xs text-neutral-500 bg-blue-50 border border-blue-100 rounded p-3">
                <strong>Tip:</strong> {template.tip}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
