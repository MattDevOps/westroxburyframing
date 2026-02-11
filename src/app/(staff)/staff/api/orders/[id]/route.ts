import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { isValidOrderStatus } from "@/lib/orderStatus";

// Type assertion to work around TypeScript cache issue with Prisma client
const prismaWithActivity: any = prisma;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      specs: true,
      photos: true,
      payments: true,
      createdBy: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const activity = await prismaWithActivity.orderActivity.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ order: { ...order, activity } });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));

  const data: any = {};

  if ("orderNumber" in body) data.orderNumber = body.orderNumber ?? null;
  if ("intakeChannel" in body) data.intakeChannel = body.intakeChannel ?? null;

  if ("dueDate" in body) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  if ("itemType" in body) data.itemType = body.itemType ?? null;
  if ("itemDescription" in body) data.itemDescription = body.itemDescription ?? null;

  if ("width" in body) data.width = body.width === "" || body.width == null ? null : Number(body.width);
  if ("height" in body) data.height = body.height === "" || body.height == null ? null : Number(body.height);
  if ("units" in body) data.units = body.units ?? null;

  if ("notesInternal" in body) data.notesInternal = body.notesInternal ?? null;
  if ("notesCustomer" in body) data.notesCustomer = body.notesCustomer ?? null;

  if ("status" in body) {
    const next = String(body.status || "").trim();
    if (!isValidOrderStatus(next)) {
      return NextResponse.json({ error: `Invalid status: ${next}` }, { status: 400 });
    }
    data.status = next;
  }

  if ("subtotalAmount" in body) data.subtotalAmount = body.subtotalAmount == null ? null : Number(body.subtotalAmount);
  if ("taxAmount" in body) data.taxAmount = body.taxAmount == null ? null : Number(body.taxAmount);
  if ("totalAmount" in body) data.totalAmount = body.totalAmount == null ? null : Number(body.totalAmount);
  if ("currency" in body) data.currency = body.currency ?? null;

  const prev = await prisma.order.findUnique({ where: { id }, select: { status: true } });
  if (!prev) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const updated = await prisma.order.update({ where: { id }, data });

  const events: Array<{ type: string; message: string }> = [];
  events.push({ type: "edit", message: "Order updated" });

  if ("status" in data && prev.status !== data.status) {
    events.push({
      type: "status_change",
      message: `Status changed: ${prev.status || "—"} → ${data.status}`,
    });
  }

  for (const ev of events) {
    await prismaWithActivity.orderActivity.create({
      data: {
        orderId: id,
        type: ev.type,
        message: ev.message,
        createdByUserId: userId,
      },
    });
  }

  return NextResponse.json({ ok: true, order: updated });
}
