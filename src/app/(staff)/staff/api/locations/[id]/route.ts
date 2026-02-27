import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /staff/api/locations/[id]
 * Get a single location
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const location = await prisma.location.findUnique({
      where: { id: params.id },
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    return NextResponse.json({ location });
  } catch (error: any) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch location" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /staff/api/locations/[id]
 * Update a location (admin only)
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, address, phone, email, active } = body;

    const location = await prisma.location.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json({ location });
  } catch (error: any) {
    console.error("Error updating location:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Location code already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update location" },
      { status: 500 }
    );
  }
}
