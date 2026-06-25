import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Postmark Inbound webhook.
 *
 * Setup:
 *   1. Postmark → Servers → (your server) → Default Inbound Stream → Settings →
 *      set webhook URL to:
 *        https://westroxburyframing.com/api/webhooks/postmark-inbound?token=<secret>
 *   2. Set env var POSTMARK_INBOUND_TOKEN=<same secret>
 *   3. Forward replies (jake@westroxburyframing.com) to the <hash>@inbound.postmarkapp.com
 *      address Postmark assigns.
 *
 * On every inbound:
 *   - Match the From address to a Lead.email
 *   - Use Claude to classify the reply into one of 5 buckets + a one-line next action
 *   - Create a LeadEmail record (direction=inbound) with the classification + suggested action
 *   - Update the Lead: repliedAt, replyText, status, cancel any pending autoFollowupAt
 *   - Always return 200 (even on no-match) so Postmark doesn't retry
 */
export async function POST(req: Request) {
  // Token check
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || req.headers.get("x-postmark-token");
  const expected = process.env.POSTMARK_INBOUND_TOKEN;
  if (!expected) {
    console.error("POSTMARK_INBOUND_TOKEN env var not set — rejecting inbound webhook");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  if (token !== expected) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let payload: {
    From?: string;
    FromFull?: { Email?: string; Name?: string };
    To?: string;
    Subject?: string;
    TextBody?: string;
    HtmlBody?: string;
    StrippedTextReply?: string;
    MessageID?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fromEmail = (payload.FromFull?.Email || payload.From || "").trim().toLowerCase();
  if (!fromEmail) {
    console.warn("Postmark inbound with no From address:", payload);
    return NextResponse.json({ ok: true, ignored: "no_from_address" });
  }

  const lead = await prisma.lead.findUnique({
    where: { email: fromEmail },
    include: {
      emails: {
        orderBy: { createdAt: "asc" },
        select: { direction: true, subject: true, body: true },
      },
    },
  });
  if (!lead) {
    // Not a B2B lead — see if it's a customer replying to an inbox message.
    const customerMsg = await prisma.customerMessage.findFirst({
      where: { email: fromEmail },
      orderBy: { createdAt: "desc" },
    });
    if (customerMsg) {
      const replyBody = (
        payload.StrippedTextReply || payload.TextBody || payload.HtmlBody || ""
      ).trim();
      await prisma.customerMessageReply.create({
        data: {
          messageId: customerMsg.id,
          direction: "inbound",
          body: replyBody || "(empty reply)",
          emailOk: true,
        },
      });
      await prisma.customerMessage.update({
        where: { id: customerMsg.id },
        data: { read: false, status: customerMsg.status === "archived" ? "new" : customerMsg.status },
      });
      console.log(`Inbound from ${fromEmail} threaded into customer message ${customerMsg.id}`);
      return NextResponse.json({ ok: true, customerMessageId: customerMsg.id });
    }
    console.log(`Inbound from ${fromEmail} doesn't match any Lead or customer — ignoring`);
    return NextResponse.json({ ok: true, ignored: "no_match" });
  }

  const body = (payload.StrippedTextReply || payload.TextBody || payload.HtmlBody || "").trim();
  const subject = (payload.Subject || "(no subject)").trim();

  // Classify with Claude. Falls back to a regex baseline if Claude is unavailable.
  const { classification, suggestedAction } = await classifyReply(body, {
    firstName: lead.firstName,
    companyName: lead.companyName,
    vertical: lead.vertical,
    priorEmails: lead.emails,
  });

  // Map classification → Lead.status
  const statusMap: Record<string, "replied_positive" | "replied_negative" | "unsubscribed"> = {
    positive: "replied_positive",
    soft_pass: "replied_negative",
    hard_pass: "replied_negative",
    unsubscribe: "unsubscribed",
    ambiguous: "replied_positive", // surface in your queue for manual review
    // Legacy buckets from the old regex classifier — keep mapping working:
    negative: "replied_negative",
    neutral: "replied_positive",
  };
  const newStatus = statusMap[classification] || "replied_positive";

  await prisma.$transaction([
    prisma.leadEmail.create({
      data: {
        leadId: lead.id,
        direction: "inbound",
        subject,
        body,
        fromAddr: fromEmail,
        toAddr: payload.To || null,
        postmarkInboundId: payload.MessageID || null,
        classification,
        suggestedAction,
      },
    }),
    prisma.lead.update({
      where: { id: lead.id },
      data: {
        repliedAt: new Date(),
        replyText: body,
        replyClassification: classification,
        status: newStatus,
        autoFollowupAt: null,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, leadId: lead.id, classification, suggestedAction });
}

interface LeadContext {
  firstName: string | null;
  companyName: string | null;
  vertical: string;
  priorEmails: Array<{ direction: string; subject: string; body: string }>;
}

/**
 * Ask Claude to classify the reply and suggest a next action. Returns regex
 * fallback if ANTHROPIC_API_KEY isn't set or Claude errors.
 */
async function classifyReply(
  replyText: string,
  ctx: LeadContext
): Promise<{ classification: string; suggestedAction: string | null }> {
  if (!process.env.ANTHROPIC_API_KEY) return regexFallback(replyText);

  const priorContext = ctx.priorEmails.length
    ? "\n\nPrior thread (most recent last):\n" +
      ctx.priorEmails
        .map((e, i) => {
          const dir = e.direction === "outbound" ? "WE WROTE" : "THEY REPLIED";
          return `--- ${dir} #${i + 1} ---\n${e.body}`;
        })
        .join("\n\n")
    : "";

  const userPrompt = `Classify this email reply from a B2B lead and suggest a one-line next action for our team.

Lead context:
- First name: ${ctx.firstName || "(unknown)"}
- Company: ${ctx.companyName || "(unknown)"}
- Vertical: ${ctx.vertical}${priorContext}

Their reply:
---
${replyText}
---

Classify into ONE of these buckets:
- "positive" — they're interested, want more info, want to talk, asking questions, said yes to something
- "soft_pass" — not interested right now, but reasonable to follow up in 6-12 months (busy season, current vendor lock-in, project on hold)
- "hard_pass" — strongly not interested, doesn't match, don't ever email again (without explicitly asking to unsubscribe)
- "unsubscribe" — explicitly asking to be removed from outreach / not contacted
- "ambiguous" — auto-reply (out of office, vacation, "got your message"), confused reply, or genuinely unclear

Suggested next action: a single short sentence telling our outreach owner what to do. Examples:
- "Reply with 3 portfolio examples and offer a 15-min call this week."
- "Move to long-term nurture — re-engage in Q4 with a holiday gallery angle."
- "Remove from list, log the reason."
- "Auto-reply only — wait for a real response before doing anything."

Return ONLY a JSON object:
{ "classification": "...", "suggestedAction": "..." }`;

  const systemPrompt = `You are an outreach assistant for West Roxbury Framing, a B2B framing shop pitching designers, law firms, hospitals, and other professional verticals. You read inbound replies and classify them so the human owner can prioritize their day.

Be honest and conservative. If a reply could go either way, mark it "ambiguous" — better to surface ambiguity for human review than guess wrong. Don't be over-optimistic. Auto-reply / out-of-office messages are always "ambiguous", never "positive".

Suggested actions should be specific and outcome-oriented, not vague ("follow up later" is bad; "follow up in October with a holiday-season pitch" is good).`;

  try {
    const client = new Anthropic();
    // Haiku 4.5 — fast, cheap, more than enough for classification
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              classification: {
                type: "string",
                enum: ["positive", "soft_pass", "hard_pass", "unsubscribe", "ambiguous"],
              },
              suggestedAction: { type: "string" },
            },
            required: ["classification", "suggestedAction"],
            additionalProperties: false,
          },
        },
      },
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.warn("Claude classify: no text block — falling back");
      return regexFallback(replyText);
    }

    const parsed = JSON.parse(textBlock.text) as {
      classification?: string;
      suggestedAction?: string;
    };
    if (!parsed.classification) return regexFallback(replyText);

    return {
      classification: parsed.classification,
      suggestedAction: parsed.suggestedAction || null,
    };
  } catch (e) {
    console.error("Claude classify failed, falling back to regex:", e);
    return regexFallback(replyText);
  }
}

function regexFallback(
  body: string
): { classification: string; suggestedAction: string | null } {
  const lower = body.toLowerCase();

  if (
    /\b(unsubscribe|remove me|take me off|do not (email|contact)|stop emailing)\b/.test(lower)
  ) {
    return { classification: "unsubscribe", suggestedAction: "Remove from list, log the reason." };
  }
  const negativeSignals = [
    /not interested/,
    /no thanks/,
    /not at this time/,
    /not a fit/,
    /\bpass\b/,
    /already (have|use|work with)/,
    /no need/,
  ];
  if (negativeSignals.some((re) => re.test(lower))) {
    return { classification: "soft_pass", suggestedAction: "Move to long-term nurture; re-engage in 6 months." };
  }
  const positiveSignals = [
    /interested/,
    /tell me more/,
    /\blet's (talk|chat|connect|meet)\b/,
    /sounds (good|great)/,
    /happy to/,
    /would love to/,
    /can we (set up|schedule)/,
    /portfolio/,
    /come (by|in|see)/,
    /\bcall\b/,
  ];
  if (positiveSignals.some((re) => re.test(lower))) {
    return { classification: "positive", suggestedAction: "Reply with portfolio examples and offer a time to talk." };
  }
  return { classification: "ambiguous", suggestedAction: "Read the reply and decide manually." };
}
