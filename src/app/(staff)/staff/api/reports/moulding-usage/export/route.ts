import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

function buildCSV(headers: string[], rows: (string | number)[][]): string {
  const escape = (val: string | number): string => {
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  return [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
}

/**
 * GET /staff/api/reports/moulding-usage/export
 * Export moulding usage report as CSV
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const groupBy = searchParams.get("groupBy") || "category";

  // Reuse the same logic from the main endpoint
  const where: any = {
    status: {
      notIn: ["cancelled", "estimate"],
    },
    components: {
      some: {
        category: "frame",
        scenarioId: null,
      },
    },
  };

  if (from || to) {
    where.createdAt = {};
    if (from) {
      where.createdAt.gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      components: {
        where: {
          category: "frame",
          scenarioId: null,
        },
        include: {
          vendorItem: {
            include: {
              vendor: true,
            },
          },
        },
      },
    },
  });

  const usageMap = new Map<string, {
    key: string;
    name: string;
    vendor?: string;
    vendorCode?: string;
    category?: string;
    totalFeet: number;
    roundedFeet: number;
    orderCount: number;
  }>();

  for (const order of orders) {
    if (!order.width || !order.height) continue;

    const widthInches = Number(order.width);
    const heightInches = Number(order.height);
    const perimeterInches = (widthInches + heightInches) * 2;
    const perimeterFeet = perimeterInches / 12;

    for (const component of order.components) {
      if (component.category !== "frame") continue;

      const quantity = Number(component.quantity) || 1;
      const feetNeeded = perimeterFeet * quantity;
      const roundedFeet = Math.round(feetNeeded * 2) / 2;

      let key: string;
      let name: string;
      let vendor: string | undefined;
      let vendorCode: string | undefined;
      let category: string | undefined;

      if (groupBy === "vendor") {
        if (component.vendorItem?.vendor) {
          key = component.vendorItem.vendor.id;
          name = component.vendorItem.vendor.name;
          vendor = component.vendorItem.vendor.name;
          vendorCode = component.vendorItem.vendor.code;
        } else {
          key = "unknown";
          name = "Unknown Vendor";
        }
      } else if (groupBy === "item") {
        if (component.vendorItem) {
          key = component.vendorItem.id;
          name = component.vendorItem.itemNumber || component.description || "Unknown Item";
          vendor = component.vendorItem.vendor?.name;
          vendorCode = component.vendorItem.vendor?.code;
          category = component.vendorItem.category || "unknown";
        } else {
          key = `desc-${component.description || "unknown"}`;
          name = component.description || "Unknown Item";
        }
      } else {
        category = component.vendorItem?.category || "unknown";
        key = category;
        name = category.charAt(0).toUpperCase() + category.slice(1);
        if (component.vendorItem?.vendor) {
          vendor = component.vendorItem.vendor.name;
          vendorCode = component.vendorItem.vendor.code;
        }
      }

      if (!usageMap.has(key)) {
        usageMap.set(key, {
          key,
          name,
          vendor,
          vendorCode,
          category,
          totalFeet: 0,
          roundedFeet: 0,
          orderCount: 0,
        });
      }

      const entry = usageMap.get(key)!;
      entry.totalFeet += feetNeeded;
      entry.roundedFeet += roundedFeet;
      entry.orderCount += 1;
    }
  }

  const usage = Array.from(usageMap.values())
    .map((entry) => ({
      ...entry,
      roundedFeet: Math.round(entry.totalFeet * 2) / 2,
    }))
    .sort((a, b) => b.roundedFeet - a.roundedFeet);

  // Build CSV
  const headers = [
    "Group",
    groupBy === "category" ? "Category" : groupBy === "vendor" ? "Vendor" : "Item",
    "Vendor",
    "Vendor Code",
    "Category",
    "Total Feet",
    "Rounded Feet (0.5)",
    "Order Count",
  ];

  const rows = usage.map((entry) => [
    entry.name,
    groupBy === "category" ? entry.category || "" : groupBy === "vendor" ? entry.name : entry.name,
    entry.vendor || "",
    entry.vendorCode || "",
    entry.category || "",
    entry.totalFeet.toFixed(2),
    entry.roundedFeet.toFixed(1),
    entry.orderCount,
  ]);

  const csv = buildCSV(headers, rows);

  const filename = `moulding-usage-${groupBy}-${from || "all"}-to-${to || "now"}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
