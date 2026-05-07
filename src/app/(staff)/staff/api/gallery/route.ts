import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/gallery
 * Returns all gallery items, sorted by sortOrder.
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.galleryItem.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ items });
}

/**
 * POST /staff/api/gallery
 * Create a new gallery item.
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (!body.imageUrl) {
    return NextResponse.json(
      { error: "imageUrl is required" },
      { status: 400 }
    );
  }

  const maxSort = await prisma.galleryItem.aggregate({
    _max: { sortOrder: true },
  });

  const item = await prisma.galleryItem.create({
    data: {
      title: body.title || null,
      description: body.description || null,
      category: body.category || "custom_framing",
      imageUrl: body.imageUrl,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      published: body.published !== false,
    },
  });

  return NextResponse.json({ item });
}
