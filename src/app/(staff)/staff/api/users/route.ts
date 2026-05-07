import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { hashPassword } from "@/lib/auth";

/**
 * GET /staff/api/users - List all staff users
 */
export async function GET(req: Request) {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            locationId: true,
            location: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            },
            createdAt: true,
        },
    });

    return NextResponse.json({ users });
}

/**
 * POST /staff/api/users - Create a new staff user
 */
export async function POST(req: Request) {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only admins can create users
    const caller = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (caller?.role !== "admin") {
        return NextResponse.json({ error: "Only admins can manage users" }, { status: 403 });
    }

    const body = await req.json();
    const name = (body.name ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const password = (body.password ?? "").toString();
    const role = body.role === "admin" ? "admin" : body.role === "receptionist" ? "receptionist" : "staff";
    const locationId = body.locationId || null;

    if (!name || !email || password.length < 6) {
        return NextResponse.json(
            { error: "Name, email, and password (min 6 chars) are required." },
            { status: 400 },
        );
    }

    // Staff users must have a location assigned (receptionist doesn't need location)
    if (role === "staff" && !locationId) {
        return NextResponse.json(
            { error: "Staff users must be assigned to a location." },
            { status: 400 },
        );
    }

    // Verify location exists if provided
    if (locationId) {
        const location = await prisma.location.findUnique({ where: { id: locationId } });
        if (!location) {
            return NextResponse.json(
                { error: "Location not found." },
                { status: 400 },
            );
        }
    }

    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash: hashPassword(password),
            role,
            locationId: role === "admin" || role === "receptionist" ? null : locationId, // Admin/Receptionist = null, Staff = assigned location
        },
    });

    return NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
}
