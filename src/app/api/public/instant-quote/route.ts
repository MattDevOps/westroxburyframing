import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import {
  INSTANT_QUOTE_SYSTEM_PROMPT,
  instantQuoteUserMessage,
} from "./prompts";

/**
 * POST /api/public/instant-quote
 *
 * Public, photo-driven instant estimate. Customer uploads one photo + optional
 * description; Claude returns a structured ballpark estimate per the
 * prompting-101 pattern. No auth (this is a lead-magnet on the marketing
 * site) — rate-limited per IP.
 *
 * Does NOT capture the customer's email here. The page that calls this can
 * follow up with a separate "save my estimate" form that creates a Lead.
 *
 * Body: multipart form-data
 *   - file: image (jpeg/png/webp/gif, ≤10MB)
 *   - description: optional string
 */

const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];
const MAX_BYTES = 10 * 1024 * 1024;

// 6 requests per IP per 10 minutes — enough for a customer to retry, low
// enough that scraping is non-trivial.
const limiter = rateLimit({ limit: 6, windowSeconds: 600 });

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = limiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many quote requests. Please wait a few minutes." },
      { status: 429 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Estimator unavailable right now — please use the contact form." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Please attach a photo of the item." }, { status: 400 });
  }

  if (!ALLOWED_MEDIA_TYPES.includes(file.type as AllowedMediaType)) {
    return NextResponse.json(
      { error: "Photo must be JPEG, PNG, WebP, or GIF." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Photo too large. Max 10MB." }, { status: 400 });
  }

  const description = (formData.get("description") || "").toString().trim() || null;

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");

  const client = new Anthropic();

  let response;
  try {
    response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4000,
      system: [
        {
          type: "text",
          text: INSTANT_QUOTE_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: file.type as AllowedMediaType,
                data: base64,
              },
            },
            { type: "text", text: instantQuoteUserMessage(description) },
          ],
        },
      ],
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Estimator error";
    console.error("[instant-quote] Claude call failed:", e);
    return NextResponse.json(
      { error: "Sorry — the estimator hit an error. Please try again or use the contact form." },
      { status: 500 }
    );
  }

  const fullText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const parsed = parseEstimate(fullText);

  return NextResponse.json({
    ...parsed,
    raw: fullText,
  });
}

function parseEstimate(text: string) {
  const grab = (tag: string) =>
    text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1].trim() ?? "";

  return {
    identifiedItem: grab("identified_item"),
    projectCategory: grab("project_category"),
    recommendedConstruction: grab("recommended_construction"),
    estimatedPriceBand: grab("estimated_price_band"),
    priceDrivers: grab("price_drivers"),
    bringInForExactQuote: grab("bring_in_for_exact_quote"),
    callToAction: grab("call_to_action"),
  };
}
