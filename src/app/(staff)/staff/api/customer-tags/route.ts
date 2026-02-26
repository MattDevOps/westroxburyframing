import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/customer-tags
 * List all customer tags
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tags = await prisma.customerTag.findMany({
    include: {
      _count: {
        select: { assignments: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ tags });
}

/**
 * POST /staff/api/customer-tags
 * Create a new customer tag
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, color } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
  }

  try {
    const tag = await prisma.customerTag.create({
      data: {
        name: name.trim(),
        color: color || null,
      },
    });

    return NextResponse.json({ tag });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "A tag with this name already exists" }, { status: 400 });
    }
    throw e;
  }
}
