import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { requireAdmin } from "@/lib/permissions";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/vendors/[id]
 * Get a single vendor with catalog items
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      catalogItems: {
        orderBy: { itemNumber: "asc" },
      },
    },
  });

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  return NextResponse.json({ vendor });
}

/**
 * PATCH /staff/api/vendors/[id]
 * Update a vendor (admin only)
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireAdmin(req);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Admin access required" }, { status: 403 });
  }

  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const data: any = {};

    if ("name" in body) data.name = String(body.name).trim();
    if ("code" in body) {
      const newCode = String(body.code).trim().toUpperCase();
      // Check if code is already taken by another vendor
      const existing = await prisma.vendor.findUnique({ where: { code: newCode } });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "Vendor code already exists" }, { status: 400 });
      }
      data.code = newCode;
    }
    if ("phone" in body) data.phone = body.phone ? String(body.phone).trim() : null;
    if ("email" in body) data.email = body.email ? String(body.email).trim() : null;
    if ("website" in body) data.website = body.website ? String(body.website).trim() : null;
    if ("notes" in body) data.notes = body.notes ? String(body.notes).trim() : null;

    const vendor = await prisma.vendor.update({
      where: { id },
      data,
    });

    return NextResponse.json({ vendor });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update vendor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /staff/api/vendors/[id]
 * Delete a vendor (admin only, only if no catalog items exist)
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireAdmin(req);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Admin access required" }, { status: 403 });
  }

  const { id } = await ctx.params;

  try {
    // Check if vendor has catalog items
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: { catalogItems: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (vendor.catalogItems.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete vendor with catalog items. Delete items first." },
        { status: 400 }
      );
    }

    await prisma.vendor.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete vendor" },
      { status: 500 }
    );
  }
}
