import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { Prisma } from "@prisma/client";

/**
 * GET /staff/api/leads
 * List leads with optional filters.
 *
 * Query params:
 *   q          - free-text search across firstName/lastName/email/companyName
 *   vertical   - filter by LeadVertical
 *   status     - filter by LeadStatus (or comma-separated list)
 *   assignedTo - userId or "me" or "unassigned"
 *   limit      - default 200
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const vertical = url.searchParams.get("vertical") || "";
  const statusParam = url.searchParams.get("status") || "";
  const assignedTo = url.searchParams.get("assignedTo") || "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 1000);

  const where: Prisma.LeadWhereInput = {};

  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
    ];
  }

  if (vertical) where.vertical = vertical as Prisma.LeadWhereInput["vertical"];

  if (statusParam) {
    const statuses = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (statuses.length === 1) {
      where.status = statuses[0] as Prisma.LeadWhereInput["status"];
    } else if (statuses.length > 1) {
      where.status = { in: statuses as Prisma.EnumLeadStatusFilter["in"] };
    }
  }

  if (assignedTo === "me") {
    where.assignedToUserId = userId;
  } else if (assignedTo === "unassigned") {
    where.assignedToUserId = null;
  } else if (assignedTo) {
    where.assignedToUserId = assignedTo;
  }

  try {
    const leads = await prisma.lead.findMany({
      where,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: limit,
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Counts by status for the summary header
    const counts = await prisma.lead.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const statusCounts: Record<string, number> = {};
    for (const c of counts) statusCounts[c.status] = c._count._all;

    return NextResponse.json({ leads, statusCounts });
  } catch (e) {
    console.error("Lead list failed:", e);
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}

/**
 * POST /staff/api/leads
 * Create a single lead. For bulk imports use /staff/api/leads/import.
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null;
  const firstName = typeof payload.firstName === "string" ? payload.firstName.trim() : null;
  const lastName = typeof payload.lastName === "string" ? payload.lastName.trim() : null;
  const companyName = typeof payload.companyName === "string" ? payload.companyName.trim() : null;

  // Need at least an email OR a company name to be useful
  if (!email && !companyName) {
    return NextResponse.json(
      { error: "Either email or company name is required" },
      { status: 400 }
    );
  }

  // Dedup by email if provided
  if (email) {
    const existing = await prisma.lead.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A lead with this email already exists", existingId: existing.id },
        { status: 409 }
      );
    }
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        firstName,
        lastName,
        email,
        companyName,
        phone: typeof payload.phone === "string" ? payload.phone.trim() : null,
        title: typeof payload.title === "string" ? payload.title.trim() : null,
        website: typeof payload.website === "string" ? payload.website.trim() : null,
        linkedinUrl: typeof payload.linkedinUrl === "string" ? payload.linkedinUrl.trim() : null,
        city: typeof payload.city === "string" ? payload.city.trim() : null,
        state: typeof payload.state === "string" ? payload.state.trim() : "MA",
        neighborhood: typeof payload.neighborhood === "string" ? payload.neighborhood.trim() : null,
        vertical: (payload.vertical as Prisma.LeadCreateInput["vertical"]) || "designer",
        status: (payload.status as Prisma.LeadCreateInput["status"]) || "new",
        source: typeof payload.source === "string" ? payload.source.trim() : null,
        notes: typeof payload.notes === "string" ? payload.notes.trim() : null,
        assignedToUserId: typeof payload.assignedToUserId === "string" ? payload.assignedToUserId : userId,
      },
    });
    return NextResponse.json({ lead });
  } catch (e) {
    console.error("Lead create failed:", e);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
