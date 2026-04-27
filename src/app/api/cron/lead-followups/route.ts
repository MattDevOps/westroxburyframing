import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

/**
 * GET /api/cron/lead-followups
 * Called daily by Vercel Cron. Finds leads where:
 *   - autoFollowupAt <= now
 *   - autoFollowupSent == false
 *   - status IN ("emailed", "followed_up")
 *   - repliedAt IS NULL
 *
 * For each: generates an AI follow-up DRAFT and writes it to the Lead's
 * draftSubject/draftBody/draftMode/draftSource/draftCreatedAt fields, then
 * marks autoFollowupSent=true so this slot isn't re-processed. Drafts surface
 * in /staff/marketing/drafts where staff approve (sends via /send-email) or
 * discard.
 *
 * NOTE: this used to send autonomously. As of the review-before-send change,
 * nothing in this route hits Postmark — the human review step is mandatory.
 *
 * Hard-coded conservative cap of 20 leads per run to avoid blasting too many
 * drafts onto the queue if a backlog accumulates.
 */
export async function GET(request: Request) {
  // Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[cron/lead-followups] ANTHROPIC_API_KEY not set — skipping AI drafts");
    return NextResponse.json(
      { ok: false, error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 }
    );
  }

  const now = new Date();

  const eligible = await prisma.lead.findMany({
    where: {
      autoFollowupAt: { lte: now },
      autoFollowupSent: false,
      repliedAt: null,
      status: { in: ["emailed", "followed_up"] },
      email: { not: null },
    },
    include: {
      emails: {
        orderBy: { createdAt: "asc" },
        select: { direction: true, subject: true, body: true, createdAt: true },
      },
      assignedTo: { select: { id: true, name: true, emailSignature: true } },
    },
    take: 20,
    orderBy: { autoFollowupAt: "asc" },
  });

  if (eligible.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  const client = new Anthropic();
  const results: Array<{
    leadId: string;
    email: string | null;
    status: "drafted" | "failed" | "skipped";
    reason?: string;
  }> = [];

  const draftedAt = new Date();

  for (const lead of eligible) {
    if (lead.draftCreatedAt) {
      results.push({
        leadId: lead.id,
        email: lead.email,
        status: "skipped",
        reason: "Existing draft pending review",
      });
      continue;
    }

    try {
      const draft = await draftFollowup(client, lead);

      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          draftSubject: draft.subject,
          draftBody: draft.body,
          draftMode: "followup",
          draftSource: "cron-followup",
          draftCreatedAt: draftedAt,
          // Mark this auto-followup slot as processed so the cron doesn't keep
          // re-drafting it every day. The slot is "done" once we've prepared a
          // draft for human review — what happens to the draft is a separate
          // human decision.
          autoFollowupSent: true,
          autoFollowupAt: null,
        },
      });

      results.push({ leadId: lead.id, email: lead.email, status: "drafted" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "unknown error";
      console.error(`[cron/lead-followups] Lead ${lead.id} draft failed:`, e);
      results.push({ leadId: lead.id, email: lead.email, status: "failed", reason: msg });
    }
  }

  const drafted = results.filter((r) => r.status === "drafted").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return NextResponse.json({
    ok: true,
    eligible: eligible.length,
    drafted,
    skipped,
    failed,
    results,
    reviewUrl: "/staff/marketing/drafts",
  });
}

const DEFAULT_SIGNATURE = `Best,
Jake
West Roxbury Framing
1741 Centre Street, West Roxbury, MA 02132
(617) 327-3890
westroxburyframing.com`;

/** Calls Claude to draft a follow-up. Inline (separate from the user-driven /draft-email route) so this cron route is self-contained. */
async function draftFollowup(
  client: Anthropic,
  lead: {
    firstName: string | null;
    lastName: string | null;
    title: string | null;
    companyName: string | null;
    vertical: string;
    city: string | null;
    state: string | null;
    neighborhood: string | null;
    website: string | null;
    notes: string | null;
    emails: Array<{ direction: string; subject: string; body: string; createdAt: Date }>;
    assignedTo: { id: string; name: string; emailSignature: string | null } | null;
  }
): Promise<{ subject: string; body: string }> {
  const signature = lead.assignedTo?.emailSignature?.trim() || DEFAULT_SIGNATURE;
  const leadFacts = [
    `First name: ${lead.firstName || "(unknown)"}`,
    `Title: ${lead.title || "(unknown)"}`,
    `Company / firm: ${lead.companyName || "(unknown)"}`,
    `Vertical: ${lead.vertical}`,
    `City / neighborhood: ${[lead.city, lead.neighborhood, lead.state].filter(Boolean).join(", ") || "(unknown)"}`,
    `Internal notes: ${lead.notes || "(none)"}`,
  ].join("\n");

  const priorEmails = lead.emails.length
    ? "\n\nPrior emails in this thread (most recent last):\n" +
      lead.emails
        .map((e, i) => {
          const dir = e.direction === "outbound" ? "OUR EMAIL TO THEM" : "THEIR REPLY";
          return `--- ${dir} #${i + 1} (${e.createdAt.toLocaleDateString()}) ---\nSubject: ${e.subject}\n\n${e.body}`;
        })
        .join("\n\n")
    : "";

  const userPrompt = `This is an AUTOMATED scheduled follow-up. The lead did not reply to our prior email(s). Draft a brief, low-pressure follow-up that:
- References the prior note briefly without repeating the entire pitch
- Offers ONE new hook (e.g. an updated portfolio piece, a relevant Boston-area project, a seasonal angle)
- Is 50-80 words MAX
- Sounds genuinely from a real person (warm, not pushy)
- End with EXACTLY this signature block, verbatim, including line breaks (do NOT modify it):
---
${signature}
---
- DO NOT use em-dashes (—). Use regular dashes or rephrase.

Lead facts:
${leadFacts}${priorEmails}

Return ONLY JSON: { "subject": string, "body": string }. Subject under 70 chars and should reference the prior note (e.g. "Following up" or "Quick check-in").`;

  const systemPrompt = `You are drafting a short follow-up email on behalf of Jake, owner of West Roxbury Framing — a 40+ year family-owned custom framing shop in West Roxbury, Boston (1741 Centre St, 617-327-3890).

Specialties: custom framing, **picture hanging and installation** (we hang the work in homes, offices, lobbies — major selling point), sports memorabilia / jersey shadow boxes, diploma framing, military / first-responder shadow boxes, corporate art programs, canvas stretching, wedding keepsakes.

Tone: warm, real-person voice. Direct. Confident but not pushy. Specific over generic. Short.

Forbidden: "I hope this email finds you well", marketing-speak, em-dashes, bullet-point feature lists, price quotes, claims we can't back up. Do NOT include any Calendly or scheduling links in auto-followups — only include those when replying to a lead who has visibly expressed interest.`;

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 8000,
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

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content from Claude");
  }
  const parsed = JSON.parse(textBlock.text) as { subject: string; body: string };
  if (!parsed.subject || !parsed.body) {
    throw new Error("Claude output missing subject or body");
  }
  return parsed;
}
