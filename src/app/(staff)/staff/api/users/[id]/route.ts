import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { hashPassword } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /staff/api/users/[id] - Update a staff user
 */
export async function PATCH(req: Request, ctx: Ctx) {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const caller = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (caller?.role !== "admin") {
        return NextResponse.json({ error: "Only admins can manage users" }, { status: 403 });
    }

    const { id } = await ctx.params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.name) data.name = body.name.toString().trim();
    if (body.email) data.email = body.email.toString().trim().toLowerCase();
    if (body.role) {
        const newRole = body.role === "admin" ? "admin" : "staff";
        data.role = newRole;
        // If changing to staff, require locationId; if changing to admin, set locationId to null
        if (newRole === "staff" && body.locationId) {
            // Verify location exists
            const location = await prisma.location.findUnique({ where: { id: body.locationId } });
            if (!location) {
                return NextResponse.json({ error: "Location not found" }, { status: 400 });
            }
            data.locationId = body.locationId;
        } else if (newRole === "admin") {
            data.locationId = null; // Admin can access all locations
        }
    }
    if (body.locationId !== undefined && body.role === "staff") {
        // Only update location if role is staff
        if (body.locationId) {
            const location = await prisma.location.findUnique({ where: { id: body.locationId } });
            if (!location) {
                return NextResponse.json({ error: "Location not found" }, { status: 400 });
            }
        }
        data.locationId = body.locationId || null;
    }
    if (body.password && body.password.length >= 6) {
        data.passwordHash = hashPassword(body.password);
    }

    const user = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ user });
}

/**
 * DELETE /staff/api/users/[id] - Delete a staff user
 */
export async function DELETE(req: Request, ctx: Ctx) {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const caller = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (caller?.role !== "admin") {
        return NextResponse.json({ error: "Only admins can manage users" }, { status: 403 });
    }

    const { id } = await ctx.params;

    // Prevent self-deletion
    if (id === userId) {
        return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    // Prevent deleting admin users
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (target?.role === "admin") {
        return NextResponse.json({ error: "Admin users cannot be deleted" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ ok: true });
}
