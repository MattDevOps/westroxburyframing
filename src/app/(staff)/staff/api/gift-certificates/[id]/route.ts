import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/gift-certificates/[id]
 * Get a single gift certificate
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const certificate = await prisma.giftCertificate.findUnique({
    where: { id },
    include: {
      issuedToCustomer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      issuedBy: {
        select: {
          name: true,
        },
      },
      redeemedOnOrder: {
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          createdAt: true,
        },
      },
    },
  });

  if (!certificate) {
    return NextResponse.json({ error: "Gift certificate not found" }, { status: 404 });
  }

  return NextResponse.json({ certificate });
}

/**
 * PATCH /staff/api/gift-certificates/[id]
 * Update a gift certificate (e.g., extend expiration, update notes)
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const updateData: any = {};
  if (body.expiresAt !== undefined) {
    updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  }
  if (body.notes !== undefined) {
    updateData.notes = body.notes;
  }

  const certificate = await prisma.giftCertificate.update({
    where: { id },
    data: updateData,
    include: {
      issuedToCustomer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      issuedBy: {
        select: {
          name: true,
        },
      },
    },
  });

  return NextResponse.json({ certificate });
}
