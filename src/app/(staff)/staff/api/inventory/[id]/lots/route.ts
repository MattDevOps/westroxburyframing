import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/inventory/[id]/lots
 * List all lots for an inventory item
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const lots = await prisma.inventoryLot.findMany({
    where: { inventoryItemId: id },
    orderBy: { receivedAt: "desc" },
  });

  return NextResponse.json({ lots });
}

/**
 * POST /staff/api/inventory/[id]/lots
 * Add a new lot to an inventory item
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  if (!body.quantity) {
    return NextResponse.json({ error: "Quantity is required" }, { status: 400 });
  }

  const lot = await prisma.inventoryLot.create({
    data: {
      inventoryItemId: id,
      quantity: Number(body.quantity),
      costPerUnit: body.costPerUnit ? Number(body.costPerUnit) : null,
      receivedAt: body.receivedAt ? new Date(body.receivedAt) : new Date(),
      purchaseOrderId: body.purchaseOrderId || null,
      notes: body.notes || null,
    },
  });

  // Update inventory quantity
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    select: { quantityOnHand: true },
  });

  if (item) {
    await prisma.inventoryItem.update({
      where: { id },
      data: {
        quantityOnHand: Number(item.quantityOnHand) + Number(body.quantity),
      },
    });
  }

  return NextResponse.json({ lot });
}
