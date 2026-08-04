import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type RecallSegmentRule = {
  hadOrder?: boolean;
  minDaysSinceLastOrder?: number;
  maxDaysSinceLastOrder?: number;
  itemTypeContains?: string;
  tagIds?: string[];
  excludeIfOrderedSinceDays?: number;
};

const SHOP_NAME = "West Roxbury Framing";
const SHOP_PHONE = "(617) 327-3890";
const SHOP_URL =
  process.env.PUBLIC_BASE_URL || "https://www.westroxburyframing.com";

export function renderTemplate(
  template: string,
  vars: Record<string, string | undefined>,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v == null ? "" : v;
  });
}

export function templateVarsForCustomer(c: {
  firstName: string;
  lastName: string;
}) {
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    shopName: SHOP_NAME,
    shopPhone: SHOP_PHONE,
    shopUrl: SHOP_URL,
  };
}

/** Inclusive on both ends. Wraps year boundary correctly (e.g. Nov 15 → Jan 5). */
export function isWithinWindow(
  today: Date,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
): boolean {
  const m = today.getMonth() + 1;
  const d = today.getDate();
  const cur = m * 100 + d;
  const start = startMonth * 100 + startDay;
  const end = endMonth * 100 + endDay;
  if (start <= end) return cur >= start && cur <= end;
  return cur >= start || cur <= end;
}

/**
 * Find customers matching a campaign's segmentation rule, respecting:
 * - `marketingOptIn = true`
 * - `email` not null
 * - excluding customers already drafted/sent for this campaign in `campaignYear`
 *
 * Note: the `some`/`none` clauses are ANDed within a single relation filter,
 * so item-type + recency conditions must be true on the same matching order.
 * Good enough for seasonal campaigns; extend if richer segmentation is needed.
 */
export async function findSegmentCustomers(args: {
  campaignId: string;
  campaignYear: number;
  rule: RecallSegmentRule;
  limit: number;
}): Promise<
  Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  }>
> {
  const { campaignId, campaignYear, rule, limit } = args;

  const existing = await prisma.recallCampaignSend.findMany({
    where: { campaignId, campaignYear },
    select: { customerId: true },
  });
  const excludeIds = existing.map((e) => e.customerId);

  const where: Prisma.CustomerWhereInput = {
    marketingOptIn: true,
    email: { not: null },
    ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
  };

  if (rule.tagIds && rule.tagIds.length > 0) {
    where.tagAssignments = { some: { tagId: { in: rule.tagIds } } };
  }

  const now = Date.now();
  const someAnd: Prisma.OrderWhereInput[] = [];
  const noneAnd: Prisma.OrderWhereInput[] = [];

  if (rule.itemTypeContains) {
    someAnd.push({
      itemType: { contains: rule.itemTypeContains, mode: "insensitive" },
    });
  }
  if (rule.maxDaysSinceLastOrder != null) {
    const cutoff = new Date(now - rule.maxDaysSinceLastOrder * 86400000);
    someAnd.push({ createdAt: { gte: cutoff } });
  }
  if (rule.minDaysSinceLastOrder != null) {
    const cutoff = new Date(now - rule.minDaysSinceLastOrder * 86400000);
    noneAnd.push({ createdAt: { gt: cutoff } });
  }
  if (rule.excludeIfOrderedSinceDays != null) {
    const cutoff = new Date(now - rule.excludeIfOrderedSinceDays * 86400000);
    noneAnd.push({ createdAt: { gt: cutoff } });
  }

  const ordersFilter: Prisma.OrderListRelationFilter = {};
  if (rule.hadOrder || someAnd.length > 0) {
    ordersFilter.some =
      someAnd.length === 0
        ? {}
        : someAnd.length === 1
          ? someAnd[0]
          : { AND: someAnd };
  }
  if (noneAnd.length > 0) {
    ordersFilter.none =
      noneAnd.length === 1 ? noneAnd[0] : { AND: noneAnd };
  }
  if (ordersFilter.some !== undefined || ordersFilter.none !== undefined) {
    where.orders = ordersFilter;
  }

  return prisma.customer.findMany({
    where,
    select: { id: true, firstName: true, lastName: true, email: true },
    take: limit,
  });
}
