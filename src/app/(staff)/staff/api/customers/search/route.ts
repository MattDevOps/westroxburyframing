import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const results = await prisma.customer.findMany({
    where: {
      OR: [
        { phone: { contains: q } },
        { email: { contains: q.toLowerCase() } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 10,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    results: results.map((c) => ({
      id: c.id,
      first_name: c.firstName,
      last_name: c.lastName,
      phone: c.phone,
      email: c.email,
      marketing_opt_in: c.marketingOptIn,
    })),
  });
}
