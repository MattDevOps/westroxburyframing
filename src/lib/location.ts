/**
 * Location context helpers
 * 
 * Functions to get the current location for filtering queries
 */

import { getStaffUserIdFromRequest } from "./staffRequest";
import { prisma } from "./db";

/**
 * Get the current location ID for filtering queries
 * Returns null if admin viewing all locations, or the location ID
 */
export async function getCurrentLocationId(req: Request): Promise<string | null> {
  try {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { location: true },
    });

    if (!user) {
      return null;
    }

    // Staff users are locked to their assigned location
    if (user.role !== "admin" && user.locationId) {
      return user.locationId;
    }

    // Admin users can override location via cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const locationMatch = cookieHeader.match(/wrx_location=([^;]+)/);
    const locationIdOverride = locationMatch ? decodeURIComponent(locationMatch[1]) : null;

    if (locationIdOverride) {
      // Verify location exists
      const location = await prisma.location.findUnique({
        where: { id: locationIdOverride },
      });
      if (location) {
        return locationIdOverride;
      }
    }

    // Admin with no override: return null to show all locations
    return null;
  } catch (error) {
    console.error("Error getting current location:", error);
    return null;
  }
}

/**
 * Get location filter for Prisma queries
 * Returns a where clause object or empty object (for admins viewing all)
 */
export async function getLocationFilter(req: Request): Promise<{ locationId: string } | Record<string, never>> {
  const locationId = await getCurrentLocationId(req);
  return locationId ? { locationId } : ({} as Record<string, never>);
}
