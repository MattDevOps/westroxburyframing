import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  // Match every word typed, in any field: "marc s" and "smith marc" both find
  // Marc Smith. Digits are matched against the phone with punctuation stripped.
  const terms = q.split(/\s+/).filter(Boolean).slice(0, 5);
  const digitsOf = (s: string) => s.replace(/\D/g, "");

  const results = await prisma.customer.findMany({
    where: {
      AND: terms.map((term) => {
        const or: any[] = [
          { firstName: { contains: term, mode: "insensitive" } },
          { lastName: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
          { organization: { contains: term, mode: "insensitive" } },
          { phone: { contains: term } },
        ];
        const digits = digitsOf(term);
        if (digits.length >= 3) or.push({ phone: { contains: digits } });
        return { OR: or };
      }),
    },
    take: 20,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    results: results.map((c) => ({
      id: c.id,
      first_name: c.firstName,
      last_name: c.lastName,
      phone: c.phone,
      email: c.email,
      organization: c.organization,
      marketing_opt_in: c.marketingOptIn,
    })),
  });
}
