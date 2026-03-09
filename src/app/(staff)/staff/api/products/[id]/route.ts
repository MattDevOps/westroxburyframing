import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/products/[id]
 * Get a single product
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      artist: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}

/**
 * PATCH /staff/api/products/[id]
 * Update a product
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const updateData: any = {};

  if (body.name !== undefined) updateData.name = String(body.name);
  if (body.description !== undefined) updateData.description = body.description || null;
  if (body.category !== undefined) updateData.category = String(body.category);
  if (body.type !== undefined) updateData.type = body.type === "consignment" ? "consignment" : "retail";
  if (body.artistId !== undefined) updateData.artistId = body.artistId || null;
  if (body.cost !== undefined) updateData.cost = Math.round(body.cost * 100);
  if (body.retailPrice !== undefined) updateData.retailPrice = Math.round(body.retailPrice * 100);
  if (body.quantityOnHand !== undefined) updateData.quantityOnHand = Number(body.quantityOnHand);
  if (body.reorderPoint !== undefined) updateData.reorderPoint = Number(body.reorderPoint);
  if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl || null;
  if (body.barcode !== undefined) updateData.barcode = body.barcode || null;
  if (body.notes !== undefined) updateData.notes = body.notes || null;
  if (body.published !== undefined) updateData.published = Boolean(body.published);

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      artist: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return NextResponse.json({ product });
}

/**
 * DELETE /staff/api/products/[id]
 * Delete a product
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  await prisma.product.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
