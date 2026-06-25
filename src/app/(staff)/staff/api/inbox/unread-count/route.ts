import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/inbox/unread-count
 * Unread count for active customer messages (drives the nav badge).
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const count = await prisma.customerMessage.count({
      where: { read: false, status: { in: ["new", "replied"] } },
    });
    return NextResponse.json({ count });
  } catch (error: any) {
    return NextResponse.json({ count: 0, error: error.message });
  }
}
