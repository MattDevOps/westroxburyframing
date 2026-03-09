import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { syncInvoiceToQBO, syncCustomerToQBO, refreshQBOToken, isQBOConfigured } from "@/lib/quickbooks";
import { env } from "@/lib/env";

/**
 * POST /staff/api/quickbooks/sync-invoice
 * Sync an invoice to QuickBooks Online
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isQBOConfigured()) {
    return NextResponse.json(
      { error: "QuickBooks Online is not configured. Please set QBO environment variables." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const invoiceId = body.invoiceId;

  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
  }

  try {
    // Get invoice with customer and orders
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        orders: {
          include: {
            components: {
              where: { scenarioId: null },
              include: {
                priceCode: true,
                vendorItem: true,
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (!invoice.customer) {
      return NextResponse.json(
        { error: "Invoice has no customer associated" },
        { status: 400 }
      );
    }

    // Refresh access token if needed
    let accessToken = env.QBO_ACCESS_TOKEN;
    let refreshToken = env.QBO_REFRESH_TOKEN;

    if (!accessToken || !env.QBO_REALM_ID) {
      return NextResponse.json(
        { error: "QuickBooks Online access token or realm ID not configured" },
        { status: 400 }
      );
    }

    // Try to refresh token (in case it expired)
    try {
      if (refreshToken) {
        const refreshed = await refreshQBOToken(refreshToken);
        accessToken = refreshed.accessToken;
        refreshToken = refreshed.refreshToken;
      }
    } catch (e) {
      // If refresh fails, try with existing token
      console.warn("Failed to refresh QBO token, using existing:", e);
    }

    // Sync customer to QBO (create if doesn't exist)
    let qboCustomerId = invoice.customer.qboCustomerId || null;

    if (!qboCustomerId) {
      const qboCustomer = await syncCustomerToQBO(accessToken, env.QBO_REALM_ID, {
        firstName: invoice.customer.firstName,
        lastName: invoice.customer.lastName,
        email: invoice.customer.email,
        phone: invoice.customer.phone,
        addressLine1: invoice.customer.addressLine1,
        addressLine2: invoice.customer.addressLine2,
        city: invoice.customer.city,
        state: invoice.customer.state,
        zip: invoice.customer.zip,
      });

      qboCustomerId = qboCustomer.id;

      // Save QBO customer ID to our customer record
      await prisma.customer.update({
        where: { id: invoice.customer.id },
        data: { qboCustomerId: qboCustomerId },
      });
    }

    // Build line items from orders
    const lineItems: Array<{ description: string; amount: number; quantity: number }> = [];

    for (const order of invoice.orders) {
      const orderDescription = order.itemType || order.itemDescription || `Order #${order.orderNumber}`;
      lineItems.push({
        description: orderDescription,
        amount: order.totalAmount,
        quantity: 1,
      });
    }

    // Sync invoice to QBO
    // Calculate due date as 30 days from invoice date (standard payment terms)
    const dueDate = new Date(invoice.createdAt);
    dueDate.setDate(dueDate.getDate() + 30);

    const qboInvoice = await syncInvoiceToQBO(accessToken, env.QBO_REALM_ID, {
      invoiceNumber: invoice.invoiceNumber,
      customerId: qboCustomerId,
      customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
      lineItems,
      totalAmount: invoice.totalAmount,
      taxAmount: invoice.taxAmount,
      invoiceDate: invoice.createdAt,
      dueDate: dueDate,
      notes: invoice.notes || undefined,
    });

    // Save QBO invoice ID to our invoice record
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        qboInvoiceId: qboInvoice.id,
        qboSyncToken: qboInvoice.syncToken,
        qboSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      qboInvoiceId: qboInvoice.id,
      qboDocNumber: qboInvoice.docNumber,
    });
  } catch (error: any) {
    console.error("Error syncing invoice to QBO:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync invoice to QuickBooks Online" },
      { status: 500 }
    );
  }
}
