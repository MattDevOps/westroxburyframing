import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/vendor-items?ids=id1,id2,id3
 * Fetch vendor catalog items by their IDs
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");
    
    if (!idsParam) {
      return NextResponse.json({ error: "ids parameter is required" }, { status: 400 });
    }

    const ids = idsParam.split(",").filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.vendorCatalogItem.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Error fetching vendor items:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch vendor items" },
      { status: 500 }
    );
  }
}
