import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import {
  LEAD_ENRICH_SYSTEM_PROMPT,
  leadEnrichUserMessage,
  type LeadEnrichInputs,
} from "./prompts";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /staff/api/leads/[id]/enrich
 *
 * Enriches a single lead by combining its CRM record with a fetched website
 * excerpt and asking Claude (prompting-101 pattern) to return a structured
 * fit-score, vertical recommendation, project-value band, and outreach angle.
 *
 * Does NOT persist anything — returns the enrichment inline so the staff page
 * can display it. Persistence can be added later (extra Lead columns or a
 * separate LeadEnrichment table).
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
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const websiteExcerpt = lead.website ? await fetchWebsiteText(lead.website).catch(() => null) : null;

  const inputs: LeadEnrichInputs = {
    firstName: lead.firstName,
    lastName: lead.lastName,
    title: lead.title,
    companyName: lead.companyName,
    website: lead.website,
    city: lead.city,
    state: lead.state,
    neighborhood: lead.neighborhood,
    vertical: lead.vertical,
    source: lead.source,
    notes: lead.notes,
    websiteExcerpt,
  };

  const client = new Anthropic();

  let response;
  try {
    response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4000,
      system: [
        {
          type: "text",
          text: LEAD_ENRICH_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: leadEnrichUserMessage(inputs) }],
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Claude API error";
    console.error("[lead enrich] Claude call failed:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const fullText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return NextResponse.json({
    ...parseEnrichment(fullText),
    raw: fullText,
    websiteUsed: Boolean(websiteExcerpt),
    usage: {
      inputTokens: response.usage.input_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      outputTokens: response.usage.output_tokens,
    },
  });
}

function parseEnrichment(text: string) {
  const grab = (tag: string) =>
    text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1].trim() ?? "";

  const fit = grab("fit_score");
  const fitScore = /^[1-5]$/.test(fit) ? parseInt(fit, 10) : null;

  return {
    fitScore,
    recommendedVertical: grab("recommended_vertical"),
    projectValueBand: grab("project_value_band"),
    signals: grab("signals"),
    recommendedAngle: grab("recommended_angle"),
    confidence: grab("confidence"),
    nextAction: grab("next_action"),
  };
}

/**
 * Best-effort fetch of the lead's website. 5s timeout, plain text only,
 * truncated to 4000 chars. Returns null on any failure.
 *
 * Same shape as the helper in draft-email/route.ts — if these duplicate
 * further, factor into src/lib/.
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
          "Mozilla/5.0 (West Roxbury Framing lead-enrichment bot; jake@westroxburyframing.com)",
      },
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const html = await res.text();

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
