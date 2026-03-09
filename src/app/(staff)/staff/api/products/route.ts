import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/products
 * List all products with optional filters
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const type = searchParams.get("type") || ""; // "retail" | "consignment"
  const lowStock = searchParams.get("lowStock") === "true";

  const where: any = {};

  if (q) {
    where.OR = [
      { sku: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (type) {
    where.type = type;
  }

  // Fetch all products and filter for low stock in memory (Prisma limitation)
  const allProducts = await prisma.product.findMany({
    where,
    include: {
      artist: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  // Filter for low stock if requested
  const products = lowStock
    ? allProducts.filter((p) => Number(p.quantityOnHand) <= Number(p.reorderPoint))
    : allProducts;

  return NextResponse.json({ products });
}

/**
 * POST /staff/api/products
 * Create a new product
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (!body.sku || !body.name || !body.category) {
    return NextResponse.json(
      { error: "Missing required fields: sku, name, category" },
      { status: 400 }
    );
  }

  // Check if SKU already exists
  const existing = await prisma.product.findUnique({
    where: { sku: body.sku },
  });

  if (existing) {
    return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      sku: String(body.sku),
      name: String(body.name),
      description: body.description || null,
      category: String(body.category),
      type: body.type === "consignment" ? "consignment" : "retail",
      artistId: body.artistId || null,
      cost: body.cost ? Math.round(body.cost * 100) : 0,
      retailPrice: body.retailPrice ? Math.round(body.retailPrice * 100) : 0,
      quantityOnHand: body.quantityOnHand ? Number(body.quantityOnHand) : 0,
      reorderPoint: body.reorderPoint ? Number(body.reorderPoint) : 0,
      imageUrl: body.imageUrl || null,
      barcode: body.barcode || null,
      notes: body.notes || null,
      published: body.published !== false,
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
  });

  return NextResponse.json({ product });
}
