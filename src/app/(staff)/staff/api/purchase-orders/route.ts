import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/purchase-orders
 * List all purchase orders (with optional filters)
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const vendorId = searchParams.get("vendorId");

  const where: any = {};
  if (status) where.status = status;
  if (vendorId) where.vendorId = vendorId;

  const orders = await prisma.purchaseOrder.findMany({
    where,
    include: {
      vendor: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, name: true } },
      lines: {
        include: {
          inventoryItem: { select: { id: true, sku: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

/**
 * POST /staff/api/purchase-orders
 * Create a new purchase order
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { vendorId, notes, lines } = body;

  if (!vendorId) {
    return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
  }

  // Verify vendor exists
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  // Generate PO number (format: PO-YYYYMMDD-XXX)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const count = await prisma.purchaseOrder.count({
    where: {
      poNumber: { startsWith: `PO-${dateStr}` },
    },
  });
  const poNumber = `PO-${dateStr}-${String(count + 1).padStart(3, "0")}`;

  // Calculate total from lines
  let totalAmount = 0;
  if (lines && Array.isArray(lines)) {
    for (const line of lines) {
      const lineTotal = Math.round(
        Number(line.quantityOrdered || 0) * Number(line.unitCost || 0) * 100
      );
      totalAmount += lineTotal;
    }
  }

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      vendorId,
      status: "draft",
      totalAmount,
      notes: notes || null,
      createdByUserId: userId,
      lines: lines
        ? {
            create: lines.map((line: any) => ({
              inventoryItemId: line.inventoryItemId || null,
              vendorItemNumber: line.vendorItemNumber || "",
              description: line.description || null,
              quantityOrdered: Number(line.quantityOrdered || 0),
              unitCost: Number(line.unitCost || 0),
              lineTotal: Math.round(
                Number(line.quantityOrdered || 0) * Number(line.unitCost || 0) * 100
              ),
              notes: line.notes || null,
            })),
          }
        : undefined,
    },
    include: {
      vendor: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, name: true } },
      lines: {
        include: {
          inventoryItem: { select: { id: true, sku: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ order: po });
}
