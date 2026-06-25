import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/messages/unread-count
 * Get count of unread messages for the current user
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const count = await prisma.staffMessage.count({
      where: {
        toUserId: userId,
        read: false,
      },
    });

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ count: 0 });
  }
}
