import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import Anthropic from "@anthropic-ai/sdk";

/**
 * POST /staff/api/leads/bulk-send
 *
 * NOTE: As of the review-before-send change, this route writes DRAFTS — it
 * does NOT send emails directly. Each lead's `draftSubject` / `draftBody` /
 * `draftMode` / `draftSource` / `draftCreatedAt` fields are populated and the
 * draft surfaces in the /staff/marketing/drafts review queue, where staff
 * approve (sends via /send-email) or discard each one.
 *
 * Body: {
 *   leadIds: string[],
 *   useAi?: boolean,    // default true: AI-draft each one. false = template fallback
 * }
 *
 * Hard cap: 25 leads per request.
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: {
    leadIds?: unknown;
    useAi?: boolean;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = Array.isArray(payload.leadIds)
    ? payload.leadIds.filter((x): x is string => typeof x === "string")
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "leadIds is required" }, { status: 400 });
  }
  if (ids.length > 25) {
    return NextResponse.json(
      { error: "Bulk send is capped at 25 leads per batch — split into multiple runs" },
      { status: 400 }
    );
  }

  const useAi = payload.useAi !== false;

  if (useAi && !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY required when useAi=true" },
      { status: 503 }
    );
  }

  const [leads, currentUser] = await Promise.all([
    prisma.lead.findMany({
      where: { id: { in: ids } },
      include: {
        emails: {
          orderBy: { createdAt: "asc" },
          select: { direction: true, subject: true, body: true, createdAt: true },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, emailSignature: true },
    }),
  ]);

  const signature = currentUser?.emailSignature?.trim() || DEFAULT_SIGNATURE;

  const client = useAi ? new Anthropic() : null;
  const results: Array<{
    leadId: string;
    email: string | null;
    status: "drafted" | "skipped" | "failed";
    reason?: string;
  }> = [];

  const now = new Date();

  for (const lead of leads) {
    // Validation per lead
    if (!lead.email) {
      results.push({ leadId: lead.id, email: null, status: "skipped", reason: "No email address" });
      continue;
    }
    if (lead.status === "unsubscribed" || lead.status === "bounced") {
      results.push({ leadId: lead.id, email: lead.email, status: "skipped", reason: `Lead status is ${lead.status}` });
      continue;
    }
    if (lead.draftCreatedAt) {
      results.push({ leadId: lead.id, email: lead.email, status: "skipped", reason: "Existing draft pending review — discard or send it first" });
      continue;
    }

    const isFollowUp = Boolean(lead.emailedAt);
    const mode = isFollowUp ? "followup" : "first_touch";

    let subject: string;
    let body: string;
    try {
      if (client) {
        const draft = await draftEmail(client, lead, mode, signature);
        subject = draft.subject;
        body = draft.body;
      } else {
        subject = fallbackSubject(lead, isFollowUp);
        body = fallbackBody(lead, isFollowUp, signature);
      }
    } catch (e) {
      console.error(`Bulk draft: AI draft failed for lead ${lead.id}:`, e);
      results.push({ leadId: lead.id, email: lead.email, status: "failed", reason: "Draft failed" });
      continue;
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        draftSubject: subject,
        draftBody: body,
        draftMode: mode,
        draftSource: "bulk-send",
        draftCreatedAt: now,
      },
    });

    results.push({ leadId: lead.id, email: lead.email, status: "drafted" });
  }

  const drafted = results.filter((r) => r.status === "drafted").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return NextResponse.json({
    ok: true,
    total: leads.length,
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

async function draftEmail(
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
  },
  mode: "first_touch" | "followup",
  signature: string
): Promise<{ subject: string; body: string }> {
  const leadFacts = [
    `First name: ${lead.firstName || "(unknown)"}`,
    `Title: ${lead.title || "(unknown)"}`,
    `Company / firm: ${lead.companyName || "(unknown)"}`,
    `Vertical: ${lead.vertical}`,
    `City / neighborhood: ${[lead.city, lead.neighborhood, lead.state].filter(Boolean).join(", ") || "(unknown)"}`,
    `Website: ${lead.website || "(none)"}`,
    `Internal notes: ${lead.notes || "(none)"}`,
  ].join("\n");

  const priorEmails = lead.emails.length
    ? "\n\nPrior thread (most recent last):\n" +
      lead.emails
        .map((e, i) => {
          const dir = e.direction === "outbound" ? "WE WROTE" : "THEY REPLIED";
          return `--- ${dir} #${i + 1} ---\nSubject: ${e.subject}\n${e.body}`;
        })
        .join("\n\n")
    : "";

  const isFollowUp = mode === "followup";
  const lengthRule = isFollowUp ? "50-100 words" : "100-200 words";
  const modeNotes = isFollowUp
    ? "This is a FOLLOW-UP. They didn't reply to our prior email. Keep it short, low-pressure, reference the prior note briefly, offer ONE new hook."
    : "This is the FIRST email to this lead. Introduce ourselves and the shop, then make the case why we'd be a good fit in 1-2 short paragraphs.";

  const userPrompt = `Draft an outreach email for the following lead.

${modeNotes}

Lead facts:
${leadFacts}${priorEmails}

Rules:
- ${lengthRule}
- Reference something specific about THEIR business if possible. Otherwise lean on the vertical.
- Sound like a real person on their phone — warm, not corporate. NO "I hope this email finds you well." NO bullet-point laundry lists unless useful.
- End with EXACTLY this signature block, verbatim, including line breaks (do NOT modify it):
---
${signature}
---
- DO NOT use em-dashes (—). Use regular dashes or rephrase.
- DO NOT include the recipient's name in the subject line.

Return ONLY a JSON object: { "subject": string, "body": string }. Subject under 70 chars.`;

  const systemPrompt = `You are drafting outreach emails on behalf of the owner of West Roxbury Framing — a 40+ year family-owned custom picture framing shop in West Roxbury, Boston (1741 Centre Street, MA 02132, 617-327-3890).

Specialties: custom framing, **picture hanging and installation** (single pieces, gallery walls, donor walls, full installations — major selling point for designers, hotels, hospitals, law firms), sports memorabilia / jersey shadow boxes, diploma framing for any school, military and first-responder shadow boxes, corporate art programs, canvas stretching, wedding keepsakes.

Tone: warm, real-person voice. Direct. Confident but not pushy. Specific over generic. Short.

Forbidden: "I hope this email finds you well", marketing-speak, em-dashes, bullet-point feature lists, price quotes, claims we can't back up. Do NOT include any Calendly or scheduling links in this email — these are bulk first-touch / follow-up emails to cold leads, not replies to interested ones.`;

  const response = await client.messages.create({
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

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content from Claude");
  }
  const parsed = JSON.parse(textBlock.text) as { subject: string; body: string };
  if (!parsed.subject || !parsed.body) throw new Error("Claude output missing subject or body");
  return parsed;
}

function fallbackSubject(lead: { companyName: string | null }, isFollowUp: boolean): string {
  const company = lead.companyName || "your firm";
  return isFollowUp ? `Following up — West Roxbury Framing & ${company}` : "Quick intro — West Roxbury Framing";
}

function fallbackBody(
  lead: { firstName: string | null; companyName: string | null },
  isFollowUp: boolean,
  signature: string
): string {
  const greeting = lead.firstName ? `Hi ${lead.firstName},` : "Hi,";
  const company = lead.companyName ? lead.companyName : "your studio";

  if (isFollowUp) {
    return `${greeting}

Wanted to circle back on my earlier note. No pressure if framing isn't a current need, just letting you know we're here when it is.

If you'd like to stop by the shop sometime to see the work in person, the door is open Mon–Fri 9:30–6 at 1741 Centre Street, West Roxbury.

${signature}
`;
  }

  return `${greeting}

I'm Jake, second-generation owner of West Roxbury Framing, a custom picture framing shop in West Roxbury that's been working with Boston-area designers, hotels, hospitals, and law firms for over 40 years.

I came across ${company} and wanted to introduce myself. We do museum-quality custom framing, conservation framing, shadow boxes, canvas stretching, and matched-moulding installations.

If framing is something ${company} handles regularly, I'd love to put a portfolio in front of you. Stop by the shop anytime, or reply to this email and we'll set something up.

${signature}
`;
}
