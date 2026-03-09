import { NextResponse } from "next/server";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { prisma } from "@/lib/db";

/**
 * GET /staff/api/locations
 * List all locations (admin can see all, staff see only their location)
 */
export async function GET(req: Request) {
  try {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { location: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Admin can see all locations, staff see only their location
    const locations = await prisma.location.findMany({
      where: user.role === "admin" ? {} : { id: user.locationId || undefined },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ locations });
  } catch (error: any) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

/**
 * POST /staff/api/locations
 * Create a new location (admin only)
 */
export async function POST(req: Request) {
  try {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, address, phone, email } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Name and code are required" },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        name,
        code,
        address: address || null,
        phone: phone || null,
        email: email || null,
      },
    });

    return NextResponse.json({ location }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating location:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Location code already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create location" },
      { status: 500 }
    );
  }
}
