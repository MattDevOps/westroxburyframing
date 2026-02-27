import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/barcode/lookup?barcode=
 * Look up products and inventory items by barcode
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const barcode = searchParams.get("barcode")?.trim();

  if (!barcode) {
    return NextResponse.json({ error: "Barcode is required" }, { status: 400 });
  }

  try {
    // Search products by barcode
    const products = await prisma.product.findMany({
      where: {
        barcode: {
          equals: barcode,
          mode: "insensitive",
        },
      },
      include: {
        artist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 10,
    });

    // Search inventory items by barcode (if they have barcode field in future)
    // For now, we'll search by vendor item number which might match barcode
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        sku: {
          equals: barcode,
          mode: "insensitive",
        },
      },
      include: {
        vendorItem: {
          include: {
            vendor: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
      take: 10,
    });

    // Search vendor catalog items by item number (might match barcode)
    const catalogItems = await prisma.vendorCatalogItem.findMany({
      where: {
        itemNumber: {
          equals: barcode,
          mode: "insensitive",
        },
        discontinued: false,
      },
      include: {
        vendor: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      take: 10,
    });

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        type: "product",
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        price: p.retailPrice,
        quantity: p.quantityOnHand,
        url: `/staff/products/${p.id}`,
      })),
      inventoryItems: inventoryItems.map((i) => ({
        id: i.id,
        type: "inventory",
        name: i.name,
        sku: i.sku,
        quantity: i.quantityOnHand,
        vendor: i.vendorItem?.vendor.name,
        url: `/staff/inventory`,
      })),
      catalogItems: catalogItems.map((c) => ({
        id: c.id,
        type: "catalog",
        name: c.description || c.itemNumber,
        itemNumber: c.itemNumber,
        vendor: c.vendor.name,
        price: c.retailPerUnit ? Number(c.retailPerUnit) * 100 : undefined,
        url: `/staff/pricing`,
      })),
    });
  } catch (error: any) {
    console.error("Error looking up barcode:", error);
    return NextResponse.json(
      { error: error.message || "Failed to lookup barcode" },
      { status: 500 }
    );
  }
}
