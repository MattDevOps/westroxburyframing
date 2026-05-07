import { NextResponse } from "next/server";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/reports/top-materials/export
 * Export top materials report as CSV
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const baseUrl = new URL("/staff/api/reports/top-materials", req.url);
    searchParams.forEach((value, key) => {
      baseUrl.searchParams.set(key, value);
    });

    const res = await fetch(baseUrl.toString(), {
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json({ error: error.error || "Failed to fetch report data" }, { status: res.status });
    }

    const data = await res.json();

    // Build CSV
    const lines: string[] = [];

    // Header
    lines.push("Top Materials Report");
    lines.push(`From: ${new Date(data.from).toLocaleDateString()}`);
    lines.push(`To: ${new Date(data.to).toLocaleDateString()}`);
    lines.push(`Category: ${data.category}`);
    lines.push("");

    // Summary
    lines.push("Summary");
    lines.push(`Total Materials,${data.summary.totalMaterials}`);
    lines.push(`Total Usage,${data.summary.totalUsage}`);
    lines.push(`Total Revenue,$${(data.summary.totalRevenue / 100).toFixed(2)}`);
    if (data.summary.totalCost !== undefined) {
      lines.push(`Total Cost,$${(data.summary.totalCost / 100).toFixed(2)}`);
      lines.push(`Total Profit,$${(data.summary.totalProfit / 100).toFixed(2)}`);
      lines.push(`Profit Margin,${data.summary.totalProfitMargin.toFixed(1)}%`);
    }
    lines.push("");

    // Category breakdown
    lines.push("Category Breakdown");
    lines.push("Category,Usage Count");
    for (const [category, count] of Object.entries(data.summary.categoryBreakdown)) {
      lines.push(`"${category}",${count}`);
    }
    lines.push("");

    // Materials
    lines.push("Top Materials");
    const hasProfit = data.materials[0]?.totalCost !== undefined;
    if (hasProfit) {
      lines.push("Rank,Name,Category,Vendor,Vendor Code,Item Number,Price Code,Usage Count,Total Quantity,Total Revenue,Total Cost,Total Profit,Profit Margin %,Avg Order Value");
      data.materials.forEach((material: any, idx: number) => {
        lines.push(
          `${idx + 1},"${material.name}","${material.category}","${material.vendor || ""}","${material.vendorCode || ""}","${material.itemNumber || ""}","${material.priceCode || ""}",${material.usageCount},${material.totalQuantity.toFixed(2)},$${(material.totalRevenue / 100).toFixed(2)},$${(material.totalCost / 100).toFixed(2)},$${(material.totalProfit / 100).toFixed(2)},${material.profitMargin.toFixed(1)},$${(material.avgOrderValue / 100).toFixed(2)}`
        );
      });
    } else {
      lines.push("Rank,Name,Category,Vendor,Vendor Code,Item Number,Price Code,Usage Count,Total Quantity,Total Revenue,Avg Order Value");
      data.materials.forEach((material: any, idx: number) => {
        lines.push(
          `${idx + 1},"${material.name}","${material.category}","${material.vendor || ""}","${material.vendorCode || ""}","${material.itemNumber || ""}","${material.priceCode || ""}",${material.usageCount},${material.totalQuantity.toFixed(2)},$${(material.totalRevenue / 100).toFixed(2)},$${(material.avgOrderValue / 100).toFixed(2)}`
        );
      });
    }

    const csv = lines.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="top-materials-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting top materials report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export top materials report" },
      { status: 500 }
    );
  }
}
