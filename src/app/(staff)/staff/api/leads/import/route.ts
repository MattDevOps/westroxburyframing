import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { Prisma } from "@prisma/client";

/**
 * POST /staff/api/leads/import
 * Body: { csv: string, vertical?: LeadVertical, source?: string }
 *
 * Parses simple CSV with a header row. Headers we recognize (case-insensitive):
 *   firstName, lastName, email, phone, title, companyName / company,
 *   website, linkedinUrl / linkedin, city, state, neighborhood, notes
 *
 * Dedupes by email (skips rows whose email already exists in Lead).
 * If vertical or source is passed, applies it to every imported row
 * (unless the row has its own column for that field).
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: { csv?: string; vertical?: string; source?: string; dryRun?: boolean };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const csv = (payload.csv || "").trim();
  if (!csv) return NextResponse.json({ error: "Missing csv body" }, { status: 400 });

  const dryRun = Boolean(payload.dryRun);

  const defaultVertical = (payload.vertical || "designer") as Prisma.LeadCreateInput["vertical"];
  const defaultSource = payload.source?.trim() || null;

  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Could not parse any rows" }, { status: 400 });
  }

  const headers = rows[0].map((h) => normalizeHeader(h));
  const dataRows = rows.slice(1);

  // Header → column index map
  const idx = (name: string) => headers.indexOf(name);

  const created: Array<{ id: string; email: string | null; companyName: string | null }> = [];
  const skipped: Array<{ row: number; reason: string }> = [];

  // Pre-fetch all existing emails so we can dedup in-memory (fast for ~1k rows)
  const allExisting = await prisma.lead.findMany({
    select: { email: true },
  });
  const existingEmails = new Set(
    allExisting.map((l) => (l.email || "").toLowerCase()).filter(Boolean)
  );

  // Track emails we're adding *in this batch* so we don't insert dupes within the same CSV
  const batchEmails = new Set<string>();

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const get = (name: string) => {
      const j = idx(name);
      if (j === -1) return null;
      const v = row[j];
      return v ? v.trim() : null;
    };

    const email = (get("email") || "").toLowerCase() || null;
    const companyName = get("company") || get("companyname") || null;
    const firstName = get("firstname") || null;
    const lastName = get("lastname") || null;

    if (!email && !companyName && !firstName) {
      skipped.push({ row: i + 2, reason: "Empty row" });
      continue;
    }

    if (email && existingEmails.has(email)) {
      skipped.push({ row: i + 2, reason: `Duplicate (already exists): ${email}` });
      continue;
    }
    if (email && batchEmails.has(email)) {
      skipped.push({ row: i + 2, reason: `Duplicate within CSV: ${email}` });
      continue;
    }

    if (dryRun) {
      // Don't write to DB — just collect what we WOULD have created.
      created.push({
        id: "(preview)",
        email,
        companyName,
      });
      if (email) batchEmails.add(email);
      continue;
    }

    try {
      const lead = await prisma.lead.create({
        data: {
          firstName,
          lastName,
          email,
          phone: get("phone"),
          title: get("title"),
          companyName,
          website: get("website"),
          linkedinUrl: get("linkedinurl") || get("linkedin"),
          city: get("city"),
          state: get("state") || "MA",
          neighborhood: get("neighborhood"),
          notes: get("notes"),
          vertical: ((get("vertical") as Prisma.LeadCreateInput["vertical"]) || defaultVertical),
          source: get("source") || defaultSource,
          status: "new",
          assignedToUserId: userId,
        },
      });
      created.push({ id: lead.id, email: lead.email, companyName: lead.companyName });
      if (email) batchEmails.add(email);
    } catch (e) {
      console.error(`Import row ${i + 2} failed:`, e);
      skipped.push({ row: i + 2, reason: "DB insert failed" });
    }
  }

  return NextResponse.json({
    dryRun,
    total: dataRows.length,
    created: created.length,
    skipped: skipped.length,
    createdIds: dryRun ? [] : created.map((c) => c.id),
    createdPreview: dryRun ? created.slice(0, 25).map((c) => ({ email: c.email, companyName: c.companyName })) : undefined,
    skippedDetail: skipped.slice(0, 50),
  });
}

// Minimal CSV parser. Handles quoted fields with escaped quotes. Doesn't support
// multi-line quoted strings — outreach CSVs from spreadsheets normally won't have those.
function parseCsv(input: string): string[][] {
  const lines = input.split(/\r?\n/).filter((l) => l.length > 0);
  return lines.map(parseCsvLine);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        result.push(current);
        current = "";
      } else {
        current += c;
      }
    }
  }
  result.push(current);
  return result;
}

function normalizeHeader(s: string): string {
  return s.trim().toLowerCase().replace(/[\s_\-]+/g, "");
}
