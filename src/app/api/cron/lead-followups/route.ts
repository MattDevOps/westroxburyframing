import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOutreachEmail } from "@/lib/email";
import Anthropic from "@anthropic-ai/sdk";

/**
 * GET /api/cron/lead-followups
 * Called daily by Vercel Cron. Finds leads where:
 *   - autoFollowupAt <= now
 *   - autoFollowupSent == false
 *   - status IN ("emailed", "followed_up")
 *   - repliedAt IS NULL
 *
 * For each: generates an AI follow-up draft, sends via Postmark, creates a
 * LeadEmail (outboundKind="auto_followup"), and updates the Lead.
 *
 * Hard-coded conservative cap of 20 leads per run to avoid blasting too many
 * follow-ups at once if a backlog accumulates.
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
    status: "sent" | "failed" | "skipped";
    reason?: string;
  }> = [];

  for (const lead of eligible) {
    try {
      const draft = await draftFollowup(client, lead);

      const sendResult = await sendOutreachEmail({
        to: lead.email!,
        subject: draft.subject,
        body: draft.body,
      });

      if (!sendResult.ok) {
        results.push({
          leadId: lead.id,
          email: lead.email,
          status: "failed",
          reason: sendResult.error,
        });
        // Don't mark autoFollowupSent — leave it queued for next run
        continue;
      }

      await prisma.$transaction([
        prisma.leadEmail.create({
          data: {
            leadId: lead.id,
            direction: "outbound",
            subject: draft.subject,
            body: draft.body,
            fromAddr: sendResult.from,
            toAddr: lead.email,
            postmarkMessageId: sendResult.messageId,
            outboundKind: "auto_followup",
          },
        }),
        prisma.lead.update({
          where: { id: lead.id },
          data: {
            emailSubject: draft.subject,
            emailBody: draft.body,
            emailedAt: new Date(),
            status: "followed_up",
            followUpCount: { increment: 1 },
            lastFollowUpAt: new Date(),
            autoFollowupSent: true,
            autoFollowupAt: null,
          },
        }),
      ]);

      results.push({ leadId: lead.id, email: lead.email, status: "sent" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "unknown error";
      console.error(`[cron/lead-followups] Lead ${lead.id} failed:`, e);
      results.push({ leadId: lead.id, email: lead.email, status: "failed", reason: msg });
    }
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return NextResponse.json({
    ok: true,
    eligible: eligible.length,
    sent,
    failed,
    results,
  });
}

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
  }
): Promise<{ subject: string; body: string }> {
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
- Sounds genuinely from Jake (warm, not pushy)
- Sign off as "Jake" then a new line with the shop name
- DO NOT use em-dashes — use regular dashes or rephrase

Lead facts:
${leadFacts}${priorEmails}

Return ONLY JSON: { "subject": string, "body": string }. Subject under 70 chars and should reference the prior note (e.g. "Following up" or "Quick check-in").`;

  const systemPrompt = `You are drafting a short follow-up email on behalf of Jake, owner of West Roxbury Framing — a 40+ year family-owned custom framing shop in West Roxbury, Boston (1741 Centre St, 617-327-3890).

Specialties: custom framing, sports memorabilia / jersey shadow boxes, diploma framing, military / first-responder shadow boxes, corporate art programs, canvas stretching, wedding keepsakes.

Tone: warm, real-person voice. Direct. Confident but not pushy. Specific over generic. Short.

Forbidden: "I hope this email finds you well", marketing-speak, em-dashes, bullet-point feature lists, price quotes, claims we can't back up.`;

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
