import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { normalizeEmail, normalizePhone } from "@/lib/ids";
import { syncMailchimpCustomer } from "@/lib/mailchimp";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      preferredContact: true,
      marketingOptIn: true,
      createdAt: true,
    },
  });

  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const orders = await prisma.order.findMany({
    where: { customerId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      createdAt: true,
      totalAmount: true,
      currency: true,
      orderNumber: true,
    },
  });

  return NextResponse.json({ customer, orders });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));

  const phone = "phone" in body ? normalizePhone(String(body.phone || "")) : undefined;
  const email = "email" in body ? normalizeEmail(body.email) : undefined;
  const marketing = "marketing_opt_in" in body ? Boolean(body.marketing_opt_in) : undefined;

  const data: any = {};
  if ("first_name" in body) data.firstName = String(body.first_name || "");
  if ("last_name" in body) data.lastName = String(body.last_name || "");
  if (phone !== undefined) {
    if (!phone) return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    data.phone = phone;
  }
  if (email !== undefined) data.email = email;

  if ("preferred_contact" in body) {
    data.preferredContact = body.preferred_contact === "call" ? "call" : "email";
  }

  if (marketing !== undefined) {
    data.marketingOptIn = marketing;
    data.marketingOptInAt = marketing ? new Date() : null;
  }

  const updated = await prisma.customer.update({ where: { id }, data });

  if (marketing === true) {
    syncMailchimpCustomer(updated).catch(() => null);
  }

  return NextResponse.json({ customer: { id: updated.id } });
}
