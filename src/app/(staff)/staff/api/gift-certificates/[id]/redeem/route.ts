import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/gift-certificates/[id]/redeem
 * Redeem a gift certificate on an order
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  if (!body.orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  if (!body.amount || body.amount <= 0) {
    return NextResponse.json({ error: "amount is required and must be greater than 0" }, { status: 400 });
  }

  // Get the certificate
  const certificate = await prisma.giftCertificate.findUnique({
    where: { id },
  });

  if (!certificate) {
    return NextResponse.json({ error: "Gift certificate not found" }, { status: 404 });
  }

  if (certificate.redeemedAt) {
    return NextResponse.json({ error: "Gift certificate already redeemed" }, { status: 400 });
  }

  if (certificate.balance < Math.round(body.amount * 100)) {
    return NextResponse.json(
      { error: `Insufficient balance. Available: $${(certificate.balance / 100).toFixed(2)}` },
      { status: 400 }
    );
  }

  if (certificate.expiresAt && certificate.expiresAt < new Date()) {
    return NextResponse.json({ error: "Gift certificate has expired" }, { status: 400 });
  }

  // Get the order
  const order = await prisma.order.findUnique({
    where: { id: body.orderId },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const redeemAmount = Math.round(body.amount * 100);
  const newBalance = certificate.balance - redeemAmount;

  // Update certificate
  const updated = await prisma.giftCertificate.update({
    where: { id },
    data: {
      balance: newBalance,
      redeemedAt: newBalance === 0 ? new Date() : null, // Only mark fully redeemed if balance is 0
      redeemedOnOrderId: body.orderId,
    },
    include: {
      issuedToCustomer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      redeemedOnOrder: {
        select: {
          id: true,
          orderNumber: true,
        },
      },
    },
  });

  // Log activity on the order
  await prisma.orderActivity.create({
    data: {
      orderId: body.orderId,
      type: "note",
      message: `Gift certificate ${certificate.certificateNumber} redeemed: $${(redeemAmount / 100).toFixed(2)}. Remaining balance: $${(newBalance / 100).toFixed(2)}`,
      createdByUserId: userId,
    },
  });

  return NextResponse.json({ certificate: updated });
}
