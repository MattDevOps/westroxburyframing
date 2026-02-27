import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/search?q=
 * Global search across orders, customers, invoices
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ orders: [], customers: [], invoices: [], products: [] });
  }

  try {
    // Search orders by order number, customer name, or item description
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: q, mode: "insensitive" } },
          { itemType: { contains: q, mode: "insensitive" } },
          { itemDescription: { contains: q, mode: "insensitive" } },
          {
            customer: {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q } },
              ],
            },
          },
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        itemType: true,
        itemDescription: true,
        totalAmount: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Search customers by name, email, or phone
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Search invoices by invoice number or customer
    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: q, mode: "insensitive" } },
          {
            customer: {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        ],
      },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalAmount: true,
        balanceDue: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Search products by SKU, name, description, or barcode
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { sku: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { barcode: { contains: q } },
        ],
      },
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        category: true,
        type: true,
        retailPrice: true,
        quantityOnHand: true,
        imageUrl: true,
        published: true,
      },
      orderBy: { name: "asc" },
      take: 10,
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        type: "order",
        title: `Order #${o.orderNumber}`,
        subtitle: `${o.customer.firstName} ${o.customer.lastName}`,
        description: o.itemType || o.itemDescription || "",
        status: o.status,
        amount: o.totalAmount,
        url: `/staff/orders/${o.id}`,
        createdAt: o.createdAt.toISOString(),
      })),
      customers: customers.map((c) => ({
        id: c.id,
        type: "customer",
        title: `${c.firstName} ${c.lastName}`,
        subtitle: c.email || c.phone || "",
        description: "",
        url: `/staff/customers/${c.id}`,
        createdAt: c.createdAt.toISOString(),
      })),
      invoices: invoices.map((i) => ({
        id: i.id,
        type: "invoice",
        title: `Invoice #${i.invoiceNumber}`,
        subtitle: `${i.customer.firstName} ${i.customer.lastName}`,
        description: `Balance: $${(i.balanceDue / 100).toFixed(2)}`,
        status: i.status,
        amount: i.totalAmount,
        url: `/staff/invoices/${i.id}`,
        createdAt: i.createdAt.toISOString(),
      })),
      products: products.map((p) => ({
        id: p.id,
        type: "product",
        title: p.name,
        subtitle: `SKU: ${p.sku}`,
        description: p.description || `${p.category.replace(/_/g, " ")} • ${p.type}`,
        status: p.published ? "published" : "draft",
        amount: p.retailPrice,
        url: `/staff/products/${p.id}`,
        createdAt: null,
      })),
    });
  } catch (error: any) {
    console.error("Error performing global search:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform search" },
      { status: 500 }
    );
  }
}
