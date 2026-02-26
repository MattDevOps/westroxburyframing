import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/price-codes
 * List all price codes
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";
  const activeOnly = searchParams.get("active") === "true";

  const where: any = {};
  if (category) where.category = category;
  if (activeOnly) where.active = true;

  const priceCodes = await prisma.priceCode.findMany({
    where,
    orderBy: [{ category: "asc" }, { code: "asc" }],
  });

  return NextResponse.json({ priceCodes });
}

/**
 * POST /staff/api/price-codes
 * Create a new price code
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { code, name, category, formula, baseRate, minCharge, wastePercent, multiplier, notes, active } = body;

    if (!code || !name || !category || !formula || baseRate === undefined) {
      return NextResponse.json(
        { error: "Code, name, category, formula, and base rate are required" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.priceCode.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Price code already exists" }, { status: 400 });
    }

    const priceCode = await prisma.priceCode.create({
      data: {
        code: String(code).trim().toUpperCase(),
        name: String(name).trim(),
        category: String(category).trim(),
        formula: String(formula).trim(),
        baseRate: Number(baseRate),
        minCharge: minCharge !== undefined ? Number(minCharge) : 0,
        wastePercent: wastePercent !== undefined ? Number(wastePercent) : 0,
        multiplier: multiplier !== undefined ? Number(multiplier) : 1,
        notes: notes ? String(notes).trim() : null,
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    return NextResponse.json({ priceCode });
  } catch (error: any) {
    console.error("Error creating price code:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create price code" },
      { status: 500 }
    );
  }
}
