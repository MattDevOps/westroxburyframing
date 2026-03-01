import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { normalizeEmail, normalizePhone } from "@/lib/ids";
import { requireAdmin } from "@/lib/permissions";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      tagAssignments: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  // Run queries in parallel for better performance
  const [orders, allOrders, invoices] = await Promise.all([
    prisma.order.findMany({
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
        itemType: true,
      },
    }),
    // Compute lifetime stats
    prisma.order.aggregate({
      where: { customerId: id, status: { notIn: ["cancelled"] } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Fetch invoices for A/R
    prisma.invoice.findMany({
      where: { customerId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalAmount: true,
        amountPaid: true,
        balanceDue: true,
        depositPercent: true,
        depositAmount: true,
        createdAt: true,
        orders: { select: { id: true, orderNumber: true } },
      },
    }),
  ]);

  // Calculate A/R balance (outstanding across all non-void/cancelled invoices)
  const arBalance = invoices
    .filter((i) => i.status !== "void" && i.status !== "cancelled" && i.status !== "paid")
    .reduce((sum, i) => sum + i.balanceDue, 0);

  const totalCollected = invoices
    .filter((i) => i.status !== "void" && i.status !== "cancelled")
    .reduce((sum, i) => sum + i.amountPaid, 0);

  const stats = {
    lifetimeValueCents: allOrders._sum.totalAmount ?? 0,
    totalOrders: allOrders._count,
    arBalance,
    totalCollected,
    totalInvoices: invoices.length,
  };

  return NextResponse.json({ customer, orders, invoices, stats });
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
  if ("address_line1" in body) data.addressLine1 = String(body.address_line1 || "").trim() || null;
  if ("address_line2" in body) data.addressLine2 = String(body.address_line2 || "").trim() || null;
  if ("city" in body) data.city = String(body.city || "").trim() || null;
  if ("state" in body) data.state = String(body.state || "").trim() || null;
  if ("zip" in body) data.zip = String(body.zip || "").trim() || null;

  if ("preferred_contact" in body) {
    data.preferredContact = body.preferred_contact === "call" ? "call" : "email";
  }

  if (marketing !== undefined) {
    data.marketingOptIn = marketing;
    data.marketingOptInAt = marketing ? new Date() : null;
  }

  const updated = await prisma.customer.update({ where: { id }, data });


  return NextResponse.json({ customer: { id: updated.id } });
}

/**
 * DELETE /staff/api/customers/[id]
 * Delete a customer (admin only)
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireAdmin(req);
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { id } = await ctx.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: { select: { id: true, orderNumber: true } },
        invoices: { select: { id: true, invoiceNumber: true } },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Unlink orders and invoices from the customer (don't delete them)
    await prisma.order.updateMany({
      where: { customerId: id },
      data: { customerId: null },
    });
    await prisma.invoice.updateMany({
      where: { customerId: id },
      data: { customerId: null },
    });

    // Delete tag assignments
    await prisma.customerTagAssignment.deleteMany({ where: { customerId: id } });

    // Delete the customer
    await prisma.customer.delete({ where: { id } });

    return NextResponse.json({ ok: true, message: "Customer deleted" });
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete customer" },
      { status: 500 }
    );
  }
}
