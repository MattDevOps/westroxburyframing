import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/gift-certificates
 * List all gift certificates with optional filters
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status"); // "active" | "redeemed" | "expired" | "all"

  const where: any = {};

  // Build search conditions
  const searchConditions: any[] = [];
  if (q) {
    searchConditions.push(
      { certificateNumber: { contains: q, mode: "insensitive" } },
      {
        issuedToCustomer: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      }
    );
  }

  // Build status conditions
  const statusConditions: any[] = [];
  if (status === "active") {
    statusConditions.push({ redeemedAt: null });
    statusConditions.push({
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    });
  } else if (status === "redeemed") {
    statusConditions.push({ redeemedAt: { not: null } });
  } else if (status === "expired") {
    statusConditions.push({ expiresAt: { lte: new Date() } });
    statusConditions.push({ redeemedAt: null });
  }

  // Combine conditions
  if (searchConditions.length > 0) {
    where.OR = searchConditions;
  }
  if (statusConditions.length > 0) {
    where.AND = statusConditions;
  }

  const certificates = await prisma.giftCertificate.findMany({
    where,
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
      redeemedOnOrder: {
        select: {
          id: true,
          orderNumber: true,
        },
      },
    },
    orderBy: { issuedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ certificates });
}

/**
 * POST /staff/api/gift-certificates
 * Create a new gift certificate
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (!body.amount || body.amount <= 0) {
    return NextResponse.json({ error: "Amount is required and must be greater than 0" }, { status: 400 });
  }

  // Generate certificate number (GC-YYYY-NNN)
  const year = new Date().getFullYear();
  const count = await prisma.giftCertificate.count({
    where: {
      certificateNumber: {
        startsWith: `GC-${year}-`,
      },
    },
  });
  const certificateNumber = `GC-${year}-${String(count + 1).padStart(3, "0")}`;

  const certificate = await prisma.giftCertificate.create({
    data: {
      certificateNumber,
      amount: Math.round(body.amount * 100), // Convert to cents
      balance: Math.round(body.amount * 100),
      issuedToCustomerId: body.customerId || null,
      issuedByUserId: userId,
      issuedAt: body.issuedAt ? new Date(body.issuedAt) : new Date(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      notes: body.notes || null,
    },
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
