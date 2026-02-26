import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/pricing/quick-price-check
 * Search vendor catalog items for quick price lookup
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";

  try {
    const where: any = {
      discontinued: false,
    };

    // Search by item number or description
    if (query) {
      where.OR = [
        { itemNumber: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    // Filter by category if provided
    if (category) {
      where.category = category;
    }

    const items = await prisma.vendorCatalogItem.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [
        { vendor: { code: "asc" } },
        { itemNumber: "asc" },
      ],
      take: 50, // Limit results for performance
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Error searching catalog items:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search catalog items" },
      { status: 500 }
    );
  }
}
