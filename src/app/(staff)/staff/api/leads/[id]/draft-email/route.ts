import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import Anthropic from "@anthropic-ai/sdk";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /staff/api/leads/[id]/draft-email
 * Body: { mode: "first_touch" | "followup" }
 *
 * Uses Claude to draft a personalized outreach email for this lead.
 * If the lead has a website, fetches it (5s timeout, plain text only) so the
 * draft can reference something specific. Returns { subject, body }.
 *
 * Requires the ANTHROPIC_API_KEY env var.
 */
export async function POST(req: Request, { params }: Params) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY env var is not configured" },
      { status: 503 }
    );
  }

  const { id } = await params;

  let payload: { mode?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mode = payload.mode === "followup" ? "followup" : "first_touch";

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      emails: {
        orderBy: { createdAt: "asc" },
        select: { direction: true, subject: true, body: true, createdAt: true },
      },
    },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Best-effort website fetch — used to personalize the draft
  let websiteExcerpt: string | null = null;
  if (lead.website) {
    websiteExcerpt = await fetchWebsiteText(lead.website).catch(() => null);
  }

  const client = new Anthropic();

  const leadFacts = [
    `First name: ${lead.firstName || "(unknown)"}`,
    `Last name: ${lead.lastName || "(unknown)"}`,
    `Email: ${lead.email || "(none)"}`,
    `Title: ${lead.title || "(unknown)"}`,
    `Company / firm: ${lead.companyName || "(unknown)"}`,
    `Vertical: ${lead.vertical}`,
    `City / neighborhood: ${[lead.city, lead.neighborhood, lead.state].filter(Boolean).join(", ") || "(unknown)"}`,
    `Website: ${lead.website || "(none)"}`,
    `Source: ${lead.source || "(unknown)"}`,
    `Internal notes about why this lead is a fit: ${lead.notes || "(none)"}`,
  ].join("\n");

  const priorEmails = lead.emails.length
    ? "\n\nPrior emails in this thread (most recent last):\n" +
      lead.emails
        .map((e, i) => {
          const dir = e.direction === "outbound" ? "OUR EMAIL TO THEM" : "THEIR REPLY";
          return `--- ${dir} #${i + 1} (${new Date(e.createdAt).toLocaleDateString()}) ---\nSubject: ${e.subject}\n\n${e.body}`;
        })
        .join("\n\n")
    : "";

  const websiteSection = websiteExcerpt
    ? `\n\nExcerpt of their website (used for personalization — reference something specific from this if you can):\n---\n${websiteExcerpt}\n---`
    : "\n\n(No website available to research — keep the draft generic but personable.)";

  const userPrompt = `Draft an outreach email for the following lead. The mode is "${mode}".

Lead facts:
${leadFacts}${priorEmails}${websiteSection}

Rules:
- If mode is "first_touch", this is our FIRST email to this lead — introduce ourselves and the shop, then make the case why we'd be a good fit for their business in 1-2 short paragraphs.
- If mode is "followup", they didn't reply to our prior email(s). Keep this short, light, and low-pressure. Don't repeat the entire pitch — reference the prior note briefly and offer one new hook.
- Reference something specific about THEIR business if the website excerpt allows. If not, lean on the vertical (e.g. for designers: "matched moulding for client installs"; for law firms: "partner diploma display walls").
- Sound like a real person wrote it on their phone — warm but not corporate. NO marketing-speak. NO "I hope this email finds you well." NO bullet points unless genuinely useful.
- 100-200 words for first_touch. 50-100 words for followup.
- Sign off as "Jake" (no last name, no title — just "Jake" then the shop name on a new line).
- DO NOT use em-dashes (—). Use regular dashes or rephrase.
- DO NOT include the recipient's name in the subject line.

Return ONLY a JSON object with two keys: "subject" (string, under 70 chars) and "body" (string, plain text with newlines preserved).`;

  const systemPrompt = `You are drafting outreach emails on behalf of Jake, the second-generation owner of West Roxbury Framing — a 40+ year family-owned custom picture framing shop in West Roxbury, Boston (1741 Centre Street, MA 02132, 617-327-3890).

The shop's positioning:
- Hand-built custom framing for 40+ years (since 1981)
- 5.0 stars on Google with 100+ reviews
- 2024 Boston Legacy Business Award
- Specialties: custom picture framing, sports memorabilia / jersey shadow boxes, diploma framing for any school, military and first-responder shadow boxes (active relationships with BPD, BFD, VA hospitals), corporate art programs (hotels, law firms, hospitals, designers), canvas stretching and gallery wraps, wedding keepsakes, photo restoration
- Free walk-in quotes — they prefer the customer brings the piece in so they can quote accurately
- Greater Boston pickup and delivery available; on-site walkthroughs for B2B projects
- Volume pricing for projects of 10+ pieces; Net-30 for established business accounts

Tone for outreach:
- Warm, direct, real-person voice. Like a small-business owner reaching out, not a marketer.
- Confident but not pushy. We have a 40+ year reputation; we don't need to oversell.
- Specific over generic. Reference something concrete about THEIR business, or the vertical-specific value we provide.
- Short. Designers and partners are busy — respect their time.

What we DO NOT do in outreach:
- No "I hope this email finds you well" / "I'm reaching out to" / similar marketing openers.
- No em-dashes.
- No bullet-point laundry lists of features unless directly answering a question.
- No price quotes (we never quote without seeing the piece).
- No claims we can't back up.

Your job: produce a single email draft (subject + body) that sounds like Jake wrote it himself, tailored to the lead's vertical, location, and (if available) what their website tells us about them.`;

  // Use Opus 4.7 with adaptive thinking for higher-quality, more personalized drafts.
  // Email drafting is intelligence-sensitive — we want sharp tone and specific personalization.
  let response;
  try {
    response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              subject: { type: "string" },
              body: { type: "string" },
            },
            required: ["subject", "body"],
            additionalProperties: false,
          },
        },
      },
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Claude API error";
    console.error("Claude draft-email failed:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Find the text block, parse the JSON
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No text content from Claude" }, { status: 500 });
  }

  let parsed: { subject?: string; body?: string };
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    console.error("Claude returned non-JSON text:", textBlock.text.slice(0, 500));
    return NextResponse.json({ error: "Claude returned malformed output" }, { status: 500 });
  }

  if (!parsed.subject || !parsed.body) {
    return NextResponse.json({ error: "Claude output missing subject or body" }, { status: 500 });
  }

  return NextResponse.json({
    subject: parsed.subject,
    body: parsed.body,
    websiteUsed: Boolean(websiteExcerpt),
  });
}

/**
 * Fetches the lead's website, strips HTML to plain text, truncates to ~4000 chars.
 * 5s timeout. Returns null on any failure.
 */
async function fetchWebsiteText(url: string): Promise<string | null> {
  const normalized = url.startsWith("http") ? url : `https://${url}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(normalized, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (West Roxbury Framing outreach research bot; jake@westroxburyframing.com)",
      },
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const html = await res.text();

    // Strip script/style, then tags, collapse whitespace
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    return text.slice(0, 4000);
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
