import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { getLocationFilter } from "@/lib/location";

type Period = "daily" | "weekly" | "monthly";

/**
 * GET /staff/api/reports/vendor-spending/export
 * Export vendor spending report as CSV
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") || "monthly") as Period;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const statusFilter = searchParams.get("status") || "received";
    
    const locationFilter = await getLocationFilter(req);

    // Build date range (same logic as main route)
    let startDate: Date;
    let endDate: Date = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (from && to) {
      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    } else {
      if (period === "daily") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "weekly") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 84);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      }
    }

    // Build where clause
    const where: any = {
      ...locationFilter,
      createdAt: { gte: startDate, lte: endDate },
    };

    if (statusFilter === "all") {
      where.status = { notIn: ["cancelled"] };
    } else if (statusFilter) {
      where.status = statusFilter;
    } else {
      where.status = "received";
    }

    // Get purchase orders
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: { select: { id: true, name: true, code: true } },
        lines: {
          select: {
            quantityOrdered: true,
            quantityReceived: true,
            unitCost: true,
            lineTotal: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate spending (same logic as main route)
    const vendorTotalsMap = new Map<string, {
      vendorId: string;
      vendorName: string;
      vendorCode: string;
      totalPOs: number;
      totalSpent: number;
    }>();

    for (const po of purchaseOrders) {
      let spendingAmount = 0;
      if (po.status === "received" || po.status === "partial") {
        for (const line of po.lines) {
          const receivedQty = Number(line.quantityReceived || 0);
          const unitCost = Number(line.unitCost || 0);
          spendingAmount += Math.round(receivedQty * unitCost * 100);
        }
      } else {
        spendingAmount = po.totalAmount;
      }

      if (!vendorTotalsMap.has(po.vendor.id)) {
        vendorTotalsMap.set(po.vendor.id, {
          vendorId: po.vendor.id,
          vendorName: po.vendor.name,
          vendorCode: po.vendor.code,
          totalPOs: 0,
          totalSpent: 0,
        });
      }

      const vendorTotal = vendorTotalsMap.get(po.vendor.id)!;
      vendorTotal.totalPOs++;
      vendorTotal.totalSpent += spendingAmount;
    }

    const vendorTotals = Array.from(vendorTotalsMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent);

    const overallTotals = {
      totalVendors: vendorTotals.length,
      totalPOs: purchaseOrders.length,
      totalSpent: vendorTotals.reduce((sum, v) => sum + v.totalSpent, 0),
    };

    // Build CSV
    const lines: string[] = [];

    // Header
    lines.push("Vendor Spending Report");
    lines.push(`Period: ${period}`);
    lines.push(`From: ${new Date(startDate).toLocaleDateString()}`);
    lines.push(`To: ${new Date(endDate).toLocaleDateString()}`);
    lines.push(`Status Filter: ${statusFilter}`);
    lines.push("");

    // Overall totals
    const avgPOValue = overallTotals.totalPOs > 0 ? overallTotals.totalSpent / overallTotals.totalPOs : 0;
    lines.push("Overall Totals");
    lines.push(`Total Vendors,${overallTotals.totalVendors}`);
    lines.push(`Total Purchase Orders,${overallTotals.totalPOs}`);
    lines.push(`Total Spent,$${(overallTotals.totalSpent / 100).toFixed(2)}`);
    lines.push(`Average PO Value,$${(avgPOValue / 100).toFixed(2)}`);
    lines.push("");

    // Vendor totals
    lines.push("Vendor Totals");
    lines.push("Vendor Code,Vendor Name,Total POs,Total Spent,Avg PO Value");
    for (const vendor of vendorTotals) {
      const vendorAvgPO = vendor.totalPOs > 0 ? vendor.totalSpent / vendor.totalPOs : 0;
      lines.push(
        `"${vendor.vendorCode}","${vendor.vendorName}",${vendor.totalPOs},$${(vendor.totalSpent / 100).toFixed(2)},$${(vendorAvgPO / 100).toFixed(2)}`
      );
    }

    const csv = lines.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="vendor-spending-${period}-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting vendor spending report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export vendor spending report" },
      { status: 500 }
    );
  }
}
