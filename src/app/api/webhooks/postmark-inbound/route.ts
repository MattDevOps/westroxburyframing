import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Postmark Inbound webhook
 *
 * Setup:
 *   1. In Postmark → Servers → (your server) → Inbound stream → set webhook URL to:
 *      https://westroxburyframing.com/api/webhooks/postmark-inbound?token=<your-secret>
 *   2. Set env var POSTMARK_INBOUND_TOKEN=<your-secret>
 *   3. Configure the OUTREACH_FROM env var so its Reply-To routes back through
 *      Postmark inbound (or set up forwarding from your inbox to the
 *      <hash>@inbound.postmarkapp.com address Postmark gives you).
 *
 * Postmark posts JSON like:
 *   {
 *     From: "designer@example.com",
 *     FromFull: { Email: "designer@example.com", Name: "Jane Smith" },
 *     To: "...",
 *     Subject: "Re: Quick intro",
 *     TextBody: "...",
 *     HtmlBody: "...",
 *     StrippedTextReply: "...just the new reply, no quoted history...",
 *     MessageID: "...",
 *     ...
 *   }
 *
 * We match the inbound email's From address to a Lead.email. If matched, we:
 *   - Create a LeadEmail record (direction=inbound)
 *   - Update Lead: repliedAt, replyText, status → replied_positive
 *   - Cancel any pending autoFollowupAt (they replied, no need to chase)
 *
 * If no Lead matches, we still return 200 (Postmark expects 200 to avoid
 * retries for non-Lead inbound mail), but log a note.
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

  // Match a Lead by email
  const lead = await prisma.lead.findUnique({ where: { email: fromEmail } });
  if (!lead) {
    console.log(`Inbound from ${fromEmail} doesn't match any Lead — ignoring`);
    return NextResponse.json({ ok: true, ignored: "no_lead_match" });
  }

  // Prefer the stripped reply (Postmark removes quoted history) — falls back to TextBody
  const body = (payload.StrippedTextReply || payload.TextBody || payload.HtmlBody || "").trim();
  const subject = (payload.Subject || "(no subject)").trim();

  // Naive auto-classification — refined later, or done by Claude in a separate pass
  const classification = autoClassify(body);

  const statusForClassification: Record<string, "replied_positive" | "replied_negative" | "unsubscribed"> = {
    positive: "replied_positive",
    neutral: "replied_positive",
    negative: "replied_negative",
    unsubscribe: "unsubscribed",
  };
  const newStatus = statusForClassification[classification] || "replied_positive";

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
      },
    }),
    prisma.lead.update({
      where: { id: lead.id },
      data: {
        repliedAt: new Date(),
        replyText: body,
        replyClassification: classification,
        status: newStatus,
        // Cancel any pending auto-followup — they replied
        autoFollowupAt: null,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, leadId: lead.id, classification });
}

/**
 * Naive keyword-based classifier. Good enough as a first pass — replace with
 * an LLM call later if you want richer classification.
 */
function autoClassify(body: string): "positive" | "negative" | "neutral" | "unsubscribe" {
  const lower = body.toLowerCase();

  if (
    /\b(unsubscribe|remove me|take me off|do not (email|contact)|stop emailing)\b/.test(lower)
  ) {
    return "unsubscribe";
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
  if (negativeSignals.some((re) => re.test(lower))) return "negative";

  const positiveSignals = [
    /interested/,
    /tell me more/,
    /\blet's (talk|chat|connect|meet)\b/,
    /sounds (good|great)/,
    /happy to/,
    /would love to/,
    /can we (set up|schedule)/,
    /what (does|is) (it|the) cost/,
    /portfolio/,
    /come (by|in|see)/,
    /next week/,
    /\bcall\b/,
  ];
  if (positiveSignals.some((re) => re.test(lower))) return "positive";

  return "neutral";
}
