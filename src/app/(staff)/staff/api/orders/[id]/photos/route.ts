import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/orders/[id]/photos
 * Upload a photo (base64 data URL) attached to this order.
 */
export async function POST(req: Request, ctx: Ctx) {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const body = await req.json();

    const url = (body.url ?? "").toString().trim();
    const caption = (body.caption ?? "").toString().trim() || null;

    if (!url) {
        return NextResponse.json({ error: "Photo data is required" }, { status: 400 });
    }

    // Verify order exists
    const order = await prisma.order.findUnique({ where: { id }, select: { id: true } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const photo = await prisma.orderPhoto.create({
        data: { orderId: id, url, caption },
    });

    return NextResponse.json({ photo: { id: photo.id, url: photo.url, caption: photo.caption } });
}

/**
 * DELETE /staff/api/orders/[id]/photos
 * Delete a photo by its ID (passed in body).
 */
export async function DELETE(req: Request, ctx: Ctx) {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const body = await req.json();
    const photoId = (body.photo_id ?? "").toString().trim();

    if (!photoId) {
        return NextResponse.json({ error: "photo_id is required" }, { status: 400 });
    }

    // Verify photo belongs to this order
    const photo = await prisma.orderPhoto.findFirst({
        where: { id: photoId, orderId: id },
    });
    if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

    await prisma.orderPhoto.delete({ where: { id: photoId } });

    return NextResponse.json({ ok: true });
}
