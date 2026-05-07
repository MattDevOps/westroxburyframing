import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/appointments?from=&to=&q=
 * Returns appointments for the staff calendar/list view.
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const q = (url.searchParams.get("q") || "").trim();

  const where: any = {};

  if (from || to) {
    where.startTime = {};
    if (from) where.startTime.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.startTime.lte = toDate;
    }
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { startTime: "asc" },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
    take: 200,
  });

  return NextResponse.json({
    appointments: appointments.map((a) => ({
      id: a.id,
      provider: a.provider,
      externalEventId: a.externalEventId,
      name: a.name,
      email: a.email,
      phone: a.phone || "",
      startTime: a.startTime.toISOString(),
      endTime: a.endTime.toISOString(),
      notes: a.notes || "",
      customerId: a.customerId,
      customerName: a.customer
        ? `${a.customer.firstName} ${a.customer.lastName}`
        : null,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
