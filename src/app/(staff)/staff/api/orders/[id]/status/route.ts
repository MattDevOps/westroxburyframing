import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { sendReadyForPickupEmail } from "@/lib/email";

function getIdFromUrl(req: Request) {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  // .../staff/api/orders/:id/status
  return segments[segments.length - 2] || "";
}

export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = getIdFromUrl(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json();
  const status = String(body.status || "");

  const valid = new Set([
    "new_design",
    "awaiting_materials",
    "in_production",
    "quality_check",
    "ready_for_pickup",
    "picked_up",
    "completed",
    "cancelled",
  ]);

  if (!valid.has(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const order = await prisma.order.update({
    where: { id },
    data: { status: status as any },
    include: { customer: true },
  });

  await prisma.activityLog.create({
    data: {
      entityType: "order",
      entityId: order.id,
      orderId: order.id,
      action: "status_changed",
      actorUserId: userId,
      metadata: { to: status },
    },
  });

  if (status === "ready_for_pickup" && order.customer.email) {
    await sendReadyForPickupEmail({
      to: order.customer.email,
      orderNumber: order.orderNumber,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
    });
  }

  return NextResponse.json({ ok: true });
}
