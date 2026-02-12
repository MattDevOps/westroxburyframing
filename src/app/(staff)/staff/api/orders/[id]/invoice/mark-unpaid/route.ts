import { NextResponse } from "next/server";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { prisma } from "@/lib/db";

const prismaWithActivity: any = prisma;

export async function POST(req: Request, ctx: any) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await ctx.params;
  const id = String(params?.id || "");
  if (!id) return NextResponse.json({ error: "Missing order id" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const status = (order as any).squareInvoiceStatus?.toUpperCase();
  if (status !== "PAID" && status !== "PARTIALLY_PAID") {
    return NextResponse.json(
      { error: "Order invoice is not marked as paid. Nothing to change." },
      { status: 400 }
    );
  }

  await prisma.order.update({
    where: { id },
    data: { squareInvoiceStatus: "UNPAID" } as any,
  });

  await prismaWithActivity.orderActivity.create({
    data: {
      orderId: id,
      type: "payment",
      message: "Invoice marked as unpaid (manual override)",
      createdByUserId: userId,
    },
  });

  return NextResponse.json({ ok: true, squareInvoiceStatus: "UNPAID" });
}
