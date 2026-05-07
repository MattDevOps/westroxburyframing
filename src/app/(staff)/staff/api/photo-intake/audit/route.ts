import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import {
  PHOTO_AUDITOR_SYSTEM_PROMPT,
  PHOTO_AUDITOR_USER_TEMPLATE,
} from "./prompts";

/**
 * POST /staff/api/photo-intake/audit
 *
 * Audits a single photo against the WRF SEO landing-page rubric (the 6 pages
 * defined in IMAGE_TODO.md) and returns a structured verdict so staff can
 * route, caption, and file the photo without manually reviewing it.
 *
 * Built with the prompting-101 pattern (see PROMPTING.md): static cached
 * system prompt + dynamic image input + structured XML output parsed
 * downstream.
 *
 * Body: multipart form-data with a "file" field (jpeg/png/webp/gif, ≤10MB).
 *
 * Returns:
 *   {
 *     verdict: "HERO sports-memorabilia" | "EXTRA diploma-framing" | "REJECT — ...",
 *     observation: string,
 *     primary: string | null,
 *     secondary: string | null,
 *     issues: string,
 *     caption: string,
 *     suggestedFilename: string,
 *     raw: string,                  // full model output for debugging
 *     usage: { inputTokens, cacheReadTokens, cacheWriteTokens, outputTokens }
 *   }
 */

const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY env var is not configured" },
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
    return NextResponse.json({ error: "Missing 'file' field" }, { status: 400 });
  }

  if (!ALLOWED_MEDIA_TYPES.includes(file.type as AllowedMediaType)) {
    return NextResponse.json(
      { error: `Invalid file type ${file.type}. Allowed: JPEG, PNG, WebP, GIF` },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");

  const client = new Anthropic();

  let response;
  try {
    response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4000,
      // prompting-101: cache the system prompt — every photo in the same
      // 5-min window reads it for ~10% the cost of writing it.
      system: [
        {
          type: "text",
          text: PHOTO_AUDITOR_SYSTEM_PROMPT,
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
            {
              type: "text",
              text: PHOTO_AUDITOR_USER_TEMPLATE(file.name || "(no filename)"),
            },
          ],
        },
      ],
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Claude API error";
    console.error("[photo-intake] Claude call failed:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const fullText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const parsed = parseVerdict(fullText);

  return NextResponse.json({
    ...parsed,
    raw: fullText,
    usage: {
      inputTokens: response.usage.input_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      outputTokens: response.usage.output_tokens,
    },
  });
}

function parseVerdict(text: string) {
  const grab = (tag: string) =>
    text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1].trim() ?? "";

  const observation = grab("observation");
  const routing = grab("page_routing");
  const issues = grab("issues");
  const caption = grab("caption");
  const suggestedFilename = grab("suggested_filename");
  const verdict = grab("verdict");

  const primary = routing.match(/PRIMARY:\s*(\S+)/)?.[1] ?? null;
  const secondary = routing.match(/SECONDARY:\s*(\S+)/)?.[1] ?? null;

  return {
    observation,
    primary: primary === "none" ? null : primary,
    secondary: secondary === "none" ? null : secondary,
    issues,
    caption,
    suggestedFilename,
    verdict,
  };
}
