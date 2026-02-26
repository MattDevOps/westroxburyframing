import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /staff/api/customers/[id]/tags
 * Get tags assigned to a customer
 */
export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const assignments = await prisma.customerTagAssignment.findMany({
    where: { customerId: id },
    include: {
      tag: true,
    },
    orderBy: { assignedAt: "desc" },
  });

  return NextResponse.json({ tags: assignments.map((a) => a.tag) });
}

/**
 * POST /staff/api/customers/[id]/tags
 * Assign a tag to a customer
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const { tagId } = body;

  if (!tagId) {
    return NextResponse.json({ error: "tagId is required" }, { status: 400 });
  }

  // Verify customer exists
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Verify tag exists
  const tag = await prisma.customerTag.findUnique({ where: { id: tagId } });
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  try {
    const assignment = await prisma.customerTagAssignment.create({
      data: {
        customerId: id,
        tagId,
      },
      include: {
        tag: true,
      },
    });

    return NextResponse.json({ assignment });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Tag is already assigned to this customer" }, { status: 400 });
    }
    throw e;
  }
}

/**
 * DELETE /staff/api/customers/[id]/tags/[tagId]
 * Remove a tag from a customer
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const tagId = searchParams.get("tagId");

  if (!tagId) {
    return NextResponse.json({ error: "tagId is required" }, { status: 400 });
  }

  try {
    await prisma.customerTagAssignment.deleteMany({
    where: {
      customerId: id,
      tagId,
    },
  });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    throw e;
  }
}
