import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/public/order-status
 * Public endpoint for customers to lookup their order status
 * Query params: orderNumber
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber");

  if (!orderNumber) {
    return NextResponse.json({ error: "Order number is required" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber.trim().toUpperCase(),
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        itemType: true,
        totalAmount: true,
        paidInFull: true,
        dueDate: true,
        createdAt: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error("Error looking up order:", error);
    return NextResponse.json(
      { error: "Failed to lookup order" },
      { status: 500 }
    );
  }
}
