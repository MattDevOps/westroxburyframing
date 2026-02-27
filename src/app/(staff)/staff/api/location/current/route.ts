import { NextResponse } from "next/server";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { prisma } from "@/lib/db";

/**
 * GET /staff/api/location/current
 * Get the current location context for the user
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

    // Check for location override in cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const locationMatch = cookieHeader.match(/wrx_location=([^;]+)/);
    const locationIdOverride = locationMatch ? decodeURIComponent(locationMatch[1]) : null;

    let currentLocation = null;
    let availableLocations: any[] = [];

    if (user.role === "admin") {
      // Admin can see all locations and switch between them
      availableLocations = await prisma.location.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      });

      if (locationIdOverride) {
        currentLocation = availableLocations.find((l) => l.id === locationIdOverride);
      }

      // Default to first location if no override
      if (!currentLocation && availableLocations.length > 0) {
        currentLocation = availableLocations[0];
        // If there's only one location, automatically set it in the cookie
        if (availableLocations.length === 1) {
          const response = NextResponse.json({
            currentLocation,
            availableLocations,
            isAdmin: user.role === "admin",
          });
          response.cookies.set("wrx_location", currentLocation.id, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
          });
          return response;
        }
      }
    } else {
      // Staff can only see their assigned location
      if (user.location) {
        currentLocation = user.location;
        availableLocations = [user.location];
      }
    }

    return NextResponse.json({
      currentLocation,
      availableLocations,
      isAdmin: user.role === "admin",
    });
  } catch (error: any) {
    console.error("Error fetching current location:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch location" },
      { status: 500 }
    );
  }
}

/**
 * POST /staff/api/location/current
 * Set the current location (admin only)
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

    const { locationId } = await req.json();

    if (!locationId) {
      return NextResponse.json({ error: "Location ID required" }, { status: 400 });
    }

    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Set location in cookie
    const response = NextResponse.json({ success: true, location });
    response.cookies.set("wrx_location", locationId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error("Error setting location:", error);
    return NextResponse.json(
      { error: error.message || "Failed to set location" },
      { status: 500 }
    );
  }
}
