/**
 * Permission helpers
 * 
 * Functions to check user permissions based on role
 */

import { getStaffUserIdFromRequest } from "./staffRequest";
import { prisma } from "./db";

/**
 * Check if the current user is an admin
 */
export async function isAdmin(req: Request): Promise<boolean> {
  try {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) return false;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Require admin access - throws error if not admin
 */
export async function requireAdmin(req: Request): Promise<void> {
  const admin = await isAdmin(req);
  if (!admin) {
    throw new Error("Admin access required");
  }
}
