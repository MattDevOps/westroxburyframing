import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/inbox
 * List customer inbox messages (website Contact Us + quote requests).
 * Query: ?status=new|replied|archived|spam|all  (default: excludes spam+archived)
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "active";

  let where: any;
  if (status === "all") where = {};
  else if (status === "active") where = { status: { in: ["new", "replied"] } };
  else where = { status };

  try {
    const messages = await prisma.customerMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        _count: { select: { replies: true } },
      },
    });

    // Counts per bucket for the tab badges.
    const grouped = await prisma.customerMessage.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const counts = {
      new: 0,
      replied: 0,
      archived: 0,
      spam: 0,
      unread: await prisma.customerMessage.count({ where: { read: false, status: { in: ["new", "replied"] } } }),
    };
    for (const g of grouped) {
      if (g.status in counts) (counts as any)[g.status] = g._count._all;
    }

    return NextResponse.json({ messages, counts });
  } catch (error: any) {
    console.error("Error listing customer inbox:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load inbox" },
      { status: 500 },
    );
  }
}
