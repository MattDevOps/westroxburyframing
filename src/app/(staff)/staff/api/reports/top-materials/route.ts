import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { getLocationFilter } from "@/lib/location";

/**
 * GET /staff/api/reports/top-materials
 * Report showing top-selling frame styles, mats, glass, etc.
 * Query params: from, to, category (optional - moulding, mat, glass, etc.)
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category"); // Optional filter

  const locationFilter = await getLocationFilter(req);

  try {
    // Build date range
    let startDate: Date;
    let endDate: Date = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (from && to) {
      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to last 3 months
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    // Get orders with components in date range
    const orders = await prisma.order.findMany({
      where: {
        ...locationFilter,
        createdAt: { gte: startDate, lte: endDate },
        status: { notIn: ["cancelled", "estimate"] },
      },
      include: {
        components: {
          include: {
            priceCode: {
              select: {
                id: true,
                code: true,
                name: true,
                category: true,
              },
            },
            vendorItem: {
              include: {
                vendor: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Aggregate by material
    const materialMap = new Map<string, {
      id: string;
      name: string;
      category: string;
      vendor: string | null;
      vendorCode: string | null;
      itemNumber: string | null;
      priceCode: string | null;
      usageCount: number;
      totalQuantity: number;
      totalRevenue: number;
      avgOrderValue: number;
    }>();

    for (const order of orders) {
      for (const component of order.components) {
        // Skip if category filter doesn't match
        if (category) {
          const compCategory = component.priceCode?.category || component.vendorItem?.category || "other";
          if (compCategory !== category) continue;
        }

        // Determine material identifier
        let materialId: string;
        let materialName: string;
        let materialCategory: string;
        let vendor: string | null = null;
        let vendorCode: string | null = null;
        let itemNumber: string | null = null;
        let priceCode: string | null = null;

        if (component.vendorItem) {
          // Vendor catalog item
          materialId = component.vendorItem.id;
          materialName = component.vendorItem.description || component.vendorItem.itemNumber;
          materialCategory = component.vendorItem.category;
          vendor = component.vendorItem.vendor.name;
          vendorCode = component.vendorItem.vendor.code;
          itemNumber = component.vendorItem.itemNumber;
        } else if (component.priceCode) {
          // Price code
          materialId = component.priceCode.id;
          materialName = component.priceCode.name;
          materialCategory = component.priceCode.category;
          priceCode = component.priceCode.code;
        } else {
          // Fallback to description
          materialId = `desc-${component.description || "unknown"}`;
          materialName = component.description || "Unknown";
          materialCategory = "other";
        }

        if (!materialMap.has(materialId)) {
          materialMap.set(materialId, {
            id: materialId,
            name: materialName,
            category: materialCategory,
            vendor,
            vendorCode,
            itemNumber,
            priceCode,
            usageCount: 0,
            totalQuantity: 0,
            totalRevenue: 0,
            avgOrderValue: 0,
          });
        }

        const material = materialMap.get(materialId)!;
        material.usageCount++;
        
        // Calculate quantity based on component type
        const quantity = Number(component.quantity || 0);
        material.totalQuantity += quantity;

        // Add component revenue (use component lineTotal if available, otherwise estimate from order)
        const componentPrice = component.lineTotal || 0;
        if (componentPrice > 0) {
          material.totalRevenue += componentPrice;
        } else {
          // Estimate: divide order total by number of components
          const componentCount = order.components.length;
          material.totalRevenue += Math.round(order.totalAmount / componentCount);
        }
      }
    }

    // Calculate averages and convert to array
    const materials = Array.from(materialMap.values())
      .map((m) => ({
        ...m,
        avgOrderValue: m.usageCount > 0 ? m.totalRevenue / m.usageCount : 0,
      }))
      .sort((a, b) => b.usageCount - a.usageCount) // Sort by usage count
      .slice(0, 50); // Top 50

    // Summary stats
    const summary = {
      totalMaterials: materials.length,
      totalUsage: materials.reduce((sum, m) => sum + m.usageCount, 0),
      totalRevenue: materials.reduce((sum, m) => sum + m.totalRevenue, 0),
      categoryBreakdown: materials.reduce((acc, m) => {
        acc[m.category] = (acc[m.category] || 0) + m.usageCount;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      category: category || "all",
      materials,
      summary,
    });
  } catch (error: any) {
    console.error("Error generating top materials report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate top materials report" },
      { status: 500 }
    );
  }
}
