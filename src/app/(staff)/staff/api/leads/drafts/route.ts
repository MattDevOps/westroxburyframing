import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/leads/drafts
 *
 * Lists every Lead that has a pending draft (set by bulk-send or the
 * lead-followups cron). The /staff/marketing/drafts page consumes this to
 * render the review queue.
 *
 * Returns leads ordered by draftCreatedAt asc (oldest first — work the
 * backlog top-down).
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const drafts = await prisma.lead.findMany({
    where: { draftCreatedAt: { not: null } },
    orderBy: { draftCreatedAt: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      title: true,
      companyName: true,
      website: true,
      vertical: true,
      city: true,
      state: true,
      neighborhood: true,
      emailedAt: true,
      followUpCount: true,
      draftSubject: true,
      draftBody: true,
      draftMode: true,
      draftSource: true,
      draftCreatedAt: true,
    },
  });

  return NextResponse.json({ drafts });
}
