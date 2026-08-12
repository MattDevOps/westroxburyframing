import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { syncInvoiceToQBO, syncCustomerToQBO, refreshQBOToken, isQBOConfigured } from "@/lib/quickbooks";
import { env } from "@/lib/env";
import { resolveBillTo } from "@/lib/billTo";

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

    // Who the receivable belongs to: the company when one is being billed.
    const billTo = resolveBillTo(
      invoice.billToCompany ?? invoice.customer.organization,
      invoice.customer
    );

    // Sync customer to QBO (create if doesn't exist).
    // Customer.qboCustomerId holds the *person's* QBO record, so it can only be
    // reused when we're billing the person — otherwise a company invoice would
    // book against the individual. Company records are resolved by name instead.
    let qboCustomerId = billTo.isCompany ? null : invoice.customer.qboCustomerId || null;

    if (!qboCustomerId) {
      const qboCustomer = await syncCustomerToQBO(accessToken, env.QBO_REALM_ID, {
        firstName: invoice.customer.firstName,
        lastName: invoice.customer.lastName,
        companyName: billTo.isCompany ? billTo.name : null,
        email: invoice.customer.email,
        phone: invoice.customer.phone,
        addressLine1: billTo.address.line1,
        addressLine2: billTo.address.line2,
        city: billTo.address.city,
        state: billTo.address.state,
        zip: billTo.address.zip,
      });

      qboCustomerId = qboCustomer.id;

      // Only cache the id when it really is this person's record.
      if (!billTo.isCompany) {
        await prisma.customer.update({
          where: { id: invoice.customer.id },
          data: { qboCustomerId: qboCustomerId },
        });
      }
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
      customerName: billTo.name,
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
