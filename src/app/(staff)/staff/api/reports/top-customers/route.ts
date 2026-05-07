import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/reports/top-customers
 *
 * Returns the top N customers by lifetime spend. Optional filters via query
 * params:
 *   - limit            (default 50, max 500)
 *   - minCents         only include customers with lifetime spend >= this (in cents)
 *   - lapsedMonths     only include customers whose last order was >= N months ago
 *                      (zeroes out idle customers — useful for recall campaigns)
 *   - marketingOptIn   "true" to filter to opt-in only (for email recall planning)
 *
 * Each row returns: customer basics + lifetimeSpendCents, orderCount, lastOrderAt.
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 500);
  const minCents = parseInt(url.searchParams.get("minCents") || "0", 10);
  const lapsedMonths = parseInt(url.searchParams.get("lapsedMonths") || "0", 10);
  const marketingOptIn = url.searchParams.get("marketingOptIn") === "true";

  // Aggregate spend + order count + last order date per customer
  const aggregates = await prisma.order.groupBy({
    by: ["customerId"],
    where: { customerId: { not: null } },
    _sum: { totalAmount: true },
    _count: { id: true },
    _max: { createdAt: true },
    orderBy: { _sum: { totalAmount: "desc" } },
  });

  // Filter by lapsed-months threshold if provided
  const lapsedCutoff =
    lapsedMonths > 0 ? new Date(Date.now() - lapsedMonths * 30 * 24 * 60 * 60 * 1000) : null;

  let filtered = aggregates.filter((a) => {
    if ((a._sum.totalAmount ?? 0) < minCents) return false;
    if (lapsedCutoff && a._max.createdAt && a._max.createdAt > lapsedCutoff) return false;
    return true;
  });

  filtered = filtered.slice(0, limit);

  const customerIds = filtered.map((a) => a.customerId!).filter(Boolean);
  if (customerIds.length === 0) {
    return NextResponse.json({ customers: [], total: 0 });
  }

  const customersWhere: Parameters<typeof prisma.customer.findMany>[0] = {
    where: { id: { in: customerIds }, ...(marketingOptIn ? { marketingOptIn: true } : {}) },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      organization: true,
      city: true,
      marketingOptIn: true,
      smsOptIn: true,
      createdAt: true,
    },
  };
  const customers = await prisma.customer.findMany(customersWhere);
  const byId = new Map(customers.map((c) => [c.id, c]));

  // Re-stitch in the order the aggregate gave us (descending spend), drop any that got
  // filtered out by marketingOptIn=true.
  const rows = filtered
    .map((a) => {
      const c = byId.get(a.customerId!);
      if (!c) return null;
      return {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        organization: c.organization,
        city: c.city,
        marketingOptIn: c.marketingOptIn,
        smsOptIn: c.smsOptIn,
        createdAt: c.createdAt.toISOString(),
        lifetimeSpendCents: a._sum.totalAmount ?? 0,
        orderCount: a._count.id ?? 0,
        lastOrderAt: a._max.createdAt?.toISOString() ?? null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return NextResponse.json({ customers: rows, total: rows.length });
}
