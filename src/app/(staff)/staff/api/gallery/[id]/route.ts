import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /staff/api/gallery/:id
 * Update a gallery item.
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();

  const data: any = {};
  if ("title" in body) data.title = body.title || null;
  if ("description" in body) data.description = body.description || null;
  if ("category" in body) data.category = body.category;
  if ("imageUrl" in body) data.imageUrl = body.imageUrl;
  if ("sortOrder" in body) data.sortOrder = Number(body.sortOrder);
  if ("published" in body) data.published = Boolean(body.published);

  const item = await prisma.galleryItem.update({
    where: { id },
    data,
  });

  return NextResponse.json({ item });
}

/**
 * DELETE /staff/api/gallery/:id
 * Delete a gallery item.
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  await prisma.galleryItem.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
