import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/price-codes/[id]
 * Get a single price code
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const priceCode = await prisma.priceCode.findUnique({
    where: { id },
  });

  if (!priceCode) {
    return NextResponse.json({ error: "Price code not found" }, { status: 404 });
  }

  return NextResponse.json({ priceCode });
}

/**
 * PATCH /staff/api/price-codes/[id]
 * Update a price code
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const data: any = {};

    if ("code" in body) {
      const newCode = String(body.code).trim().toUpperCase();
      // Check if code is already taken by another price code
      const existing = await prisma.priceCode.findUnique({ where: { code: newCode } });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "Price code already exists" }, { status: 400 });
      }
      data.code = newCode;
    }
    if ("name" in body) data.name = String(body.name).trim();
    if ("category" in body) data.category = String(body.category).trim();
    if ("formula" in body) data.formula = String(body.formula).trim();
    if ("baseRate" in body) data.baseRate = Number(body.baseRate);
    if ("minCharge" in body) data.minCharge = Number(body.minCharge);
    if ("wastePercent" in body) data.wastePercent = Number(body.wastePercent);
    if ("multiplier" in body) data.multiplier = Number(body.multiplier);
    if ("notes" in body) data.notes = body.notes ? String(body.notes).trim() : null;
    if ("active" in body) data.active = Boolean(body.active);

    const priceCode = await prisma.priceCode.update({
      where: { id },
      data,
    });

    return NextResponse.json({ priceCode });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Price code not found" }, { status: 404 });
    }
    console.error("Error updating price code:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update price code" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /staff/api/price-codes/[id]
 * Delete a price code
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  try {
    await prisma.priceCode.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Price code not found" }, { status: 404 });
    }
    console.error("Error deleting price code:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete price code" },
      { status: 500 }
    );
  }
}
