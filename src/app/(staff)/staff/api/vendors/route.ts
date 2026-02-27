import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { requireAdmin } from "@/lib/permissions";

/**
 * GET /staff/api/vendors
 * List all vendors
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendors = await prisma.vendor.findMany({
    orderBy: { name: "asc" },
    include: {
      catalogItems: {
        where: { discontinued: false },
        select: { id: true, itemNumber: true, description: true, category: true },
      },
    },
  });

  return NextResponse.json({ vendors });
}

/**
 * POST /staff/api/vendors
 * Create a new vendor (admin only)
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireAdmin(req);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, code, phone, email, website, notes } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 });
    }

    // Check if code already exists
    const existing = await prisma.vendor.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Vendor code already exists" }, { status: 400 });
    }

    const vendor = await prisma.vendor.create({
      data: {
        name: String(name).trim(),
        code: String(code).trim().toUpperCase(),
        phone: phone ? String(phone).trim() : null,
        email: email ? String(email).trim() : null,
        website: website ? String(website).trim() : null,
        notes: notes ? String(notes).trim() : null,
      },
    });

    return NextResponse.json({ vendor });
  } catch (error: any) {
    console.error("Error creating vendor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create vendor" },
      { status: 500 }
    );
  }
}
