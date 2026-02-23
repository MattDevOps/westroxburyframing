import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/public/gallery?category=...
 * Public gallery endpoint — returns published items only.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") || "";

  const where: any = { published: true };
  if (category) where.category = category;

  const items = await prisma.galleryItem.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      imageUrl: true,
    },
  });

  return NextResponse.json({ items });
}
