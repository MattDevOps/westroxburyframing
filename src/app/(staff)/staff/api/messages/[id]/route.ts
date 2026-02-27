import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/messages/[id]
 * Get a single message
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const message = await prisma.staffMessage.findUnique({
    where: { id },
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

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  // Only allow sender or recipient to view
  if (message.fromUserId !== userId && message.toUserId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Mark as read if recipient is viewing
  if (message.toUserId === userId && !message.read) {
    await prisma.staffMessage.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
    message.read = true;
    message.readAt = new Date();
  }

  return NextResponse.json({ message });
}

/**
 * PATCH /staff/api/messages/[id]
 * Mark message as read/unread
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const message = await prisma.staffMessage.findUnique({
    where: { id },
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  // Only recipient can mark as read/unread
  if (message.toUserId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const read = body.read !== undefined ? Boolean(body.read) : true;

  const updated = await prisma.staffMessage.update({
    where: { id },
    data: {
      read,
      readAt: read ? new Date() : null,
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

  return NextResponse.json({ message: updated });
}
