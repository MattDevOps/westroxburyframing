import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /staff/api/customer-tags/[id]
 * Update a customer tag
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();

  const updateData: any = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Tag name cannot be empty" }, { status: 400 });
    }
    updateData.name = body.name.trim();
  }
  if (body.color !== undefined) {
    updateData.color = body.color || null;
  }

  try {
    const tag = await prisma.customerTag.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ tag });
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }
    if (e.code === "P2002") {
      return NextResponse.json({ error: "A tag with this name already exists" }, { status: 400 });
    }
    throw e;
  }
}

/**
 * DELETE /staff/api/customer-tags/[id]
 * Delete a customer tag (removes all assignments)
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  try {
    await prisma.customerTag.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }
    throw e;
  }
}
