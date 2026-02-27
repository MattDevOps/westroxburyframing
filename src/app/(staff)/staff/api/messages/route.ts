import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/messages
 * Get messages for the current user (inbox and sent)
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || "inbox"; // "inbox" | "sent"
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  try {
    if (folder === "inbox") {
      const where: any = { toUserId: userId };
      if (unreadOnly) {
        where.read = false;
      }

      const messages = await prisma.staffMessage.findMany({
        where,
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return NextResponse.json({ messages });
    } else {
      // sent folder
      const messages = await prisma.staffMessage.findMany({
        where: { fromUserId: userId },
        include: {
          toUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return NextResponse.json({ messages });
    }
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /staff/api/messages
 * Send a new message
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (!body.toUserId || !body.subject || !body.body) {
    return NextResponse.json(
      { error: "Missing required fields: toUserId, subject, body" },
      { status: 400 }
    );
  }

  // Verify recipient exists
  const recipient = await prisma.user.findUnique({
    where: { id: body.toUserId },
  });

  if (!recipient) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  // Don't allow sending to self
  if (body.toUserId === userId) {
    return NextResponse.json({ error: "Cannot send message to yourself" }, { status: 400 });
  }

  try {
    const message = await prisma.staffMessage.create({
      data: {
        fromUserId: userId,
        toUserId: body.toUserId,
        subject: String(body.subject),
        body: String(body.body),
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
