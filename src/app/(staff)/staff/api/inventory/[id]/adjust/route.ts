import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/inventory/[id]/adjust
 * Adjust inventory quantity (add, subtract, set)
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const { type, quantity, reason, notes } = body;

  if (!type || !["add", "subtract", "set"].includes(type)) {
    return NextResponse.json({ error: "Invalid type. Must be 'add', 'subtract', or 'set'" }, { status: 400 });
  }

  if (quantity === undefined || quantity === null) {
    return NextResponse.json({ error: "Quantity is required" }, { status: 400 });
  }

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    select: { quantityOnHand: true },
  });

  if (!item) return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });

  let newQuantity: number;
  if (type === "add") {
    newQuantity = Number(item.quantityOnHand) + Number(quantity);
  } else if (type === "subtract") {
    newQuantity = Math.max(0, Number(item.quantityOnHand) - Number(quantity));
  } else {
    newQuantity = Number(quantity);
  }

  const updated = await prisma.inventoryItem.update({
    where: { id },
    data: { quantityOnHand: newQuantity },
    include: {
      vendorItem: {
        include: { vendor: { select: { name: true, code: true } } },
      },
    },
  });

  // Create adjustment log entry (could be stored in a separate table, but for now just return)
  return NextResponse.json({
    item: updated,
    adjustment: {
      type,
      quantity: Number(quantity),
      previousQuantity: Number(item.quantityOnHand),
      newQuantity,
      reason: reason || null,
      notes: notes || null,
    },
  });
}
