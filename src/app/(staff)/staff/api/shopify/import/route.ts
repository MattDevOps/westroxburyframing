import { NextResponse } from "next/server";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { prisma } from "@/lib/db";
import {
  importShopifyOrders,
  importShopifyProducts,
  importShopifyCustomers,
} from "@/lib/shopify";

export async function POST(req: Request) {
  try {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, sinceId } = await req.json();

    if (!type || !["orders", "products", "customers"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'orders', 'products', or 'customers'" },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    let errors: string[] = [];

    if (type === "orders") {
      const orders = await importShopifyOrders(sinceId);
      
      for (const shopifyOrder of orders) {
        try {
          // Find or create customer
          let customer = null;
          if (shopifyOrder.customer?.email) {
            customer = await prisma.customer.findUnique({
              where: { email: shopifyOrder.customer.email },
            });

            if (!customer && shopifyOrder.customer) {
              customer = await prisma.customer.create({
                data: {
                  email: shopifyOrder.customer.email,
                  firstName: shopifyOrder.customer.first_name || "Shopify",
                  lastName: shopifyOrder.customer.last_name || "Customer",
                  phone: shopifyOrder.customer.phone || null,
                  marketingOptIn: shopifyOrder.customer.accepts_marketing || false,
                },
              });
            }
          }

          // Check if order already exists (by Shopify order name/number)
          const existingOrder = await prisma.order.findFirst({
            where: {
              notes: {
                contains: `Shopify Order: ${shopifyOrder.name}`,
              },
            },
          });

          if (existingOrder) {
            skipped++;
            continue;
          }

          // Create order
          if (customer) {
            // Get default location
            const defaultLocation = await prisma.location.findFirst({
              where: { active: true },
              orderBy: { createdAt: "asc" },
            });

            await prisma.order.create({
              data: {
                customerId: customer.id,
                locationId: defaultLocation?.id || null,
                createdByUserId: userId,
                status: "new_design",
                intakeChannel: "web_lead",
                notesCustomer: `Imported from Shopify\nOrder: ${shopifyOrder.name}\nShopify Order ID: ${shopifyOrder.id}\nFinancial Status: ${shopifyOrder.financial_status}\nFulfillment Status: ${shopifyOrder.fulfillment_status || "unfulfilled"}\nTotal: ${shopifyOrder.currency} ${shopifyOrder.total_price}`,
                subtotalAmount: Math.round(parseFloat(shopifyOrder.subtotal_price || shopifyOrder.total_price) * 100),
                taxAmount: Math.round(parseFloat(shopifyOrder.total_tax || "0") * 100),
                totalAmount: Math.round(parseFloat(shopifyOrder.total_price) * 100),
                currency: shopifyOrder.currency || "USD",
                paidInFull: shopifyOrder.financial_status === "paid",
              },
            });
            imported++;
          } else {
            skipped++;
            errors.push(`Order ${shopifyOrder.name}: No customer email`);
          }
        } catch (error: any) {
          errors.push(`Order ${shopifyOrder.name}: ${error.message}`);
        }
      }
    } else if (type === "products") {
      const products = await importShopifyProducts(sinceId);

      for (const shopifyProduct of products) {
        try {
          // Check if product already exists (by SKU)
          const variant = shopifyProduct.variants[0];
          if (variant?.sku) {
            const existing = await prisma.product.findUnique({
              where: { sku: variant.sku },
            });

            if (existing) {
              skipped++;
              continue;
            }

            await prisma.product.create({
              data: {
                sku: variant.sku,
                name: shopifyProduct.title,
                description: shopifyProduct.body_html || null,
                category: shopifyProduct.product_type || "Retail",
                type: "retail",
                cost: 0, // Would need to map from Shopify cost if available
                retailPrice: Math.round(parseFloat(variant.price) * 100), // Convert to cents
                quantityOnHand: variant.inventory_quantity || 0,
                barcode: variant.barcode || null,
                imageUrl: shopifyProduct.images[0]?.src || null,
                published: shopifyProduct.status === "active",
              },
            });
            imported++;
          } else {
            skipped++;
            errors.push(`Product ${shopifyProduct.title}: No SKU`);
          }
        } catch (error: any) {
          errors.push(`Product ${shopifyProduct.title}: ${error.message}`);
        }
      }
    } else if (type === "customers") {
      const customers = await importShopifyCustomers(sinceId);

      for (const shopifyCustomer of customers) {
        try {
          if (!shopifyCustomer.email) {
            skipped++;
            continue;
          }

          const existing = await prisma.customer.findUnique({
            where: { email: shopifyCustomer.email },
          });

          if (existing) {
            // Update existing customer with Shopify data if missing
            await prisma.customer.update({
              where: { id: existing.id },
              data: {
                firstName: existing.firstName || shopifyCustomer.first_name || "Shopify",
                lastName: existing.lastName || shopifyCustomer.last_name || "Customer",
                phone: existing.phone || shopifyCustomer.phone || null,
                marketingOptIn: shopifyCustomer.accepts_marketing,
                addressLine1: existing.addressLine1 || shopifyCustomer.addresses[0]?.address1 || null,
                addressLine2: existing.addressLine2 || shopifyCustomer.addresses[0]?.address2 || null,
                city: existing.city || shopifyCustomer.addresses[0]?.city || null,
                state: existing.state || shopifyCustomer.addresses[0]?.province || null,
                zip: existing.zip || shopifyCustomer.addresses[0]?.zip || null,
              },
            });
            skipped++; // Counted as update, not import
          } else {
            await prisma.customer.create({
              data: {
                email: shopifyCustomer.email,
                firstName: shopifyCustomer.first_name || "Shopify",
                lastName: shopifyCustomer.last_name || "Customer",
                phone: shopifyCustomer.phone || null,
                marketingOptIn: shopifyCustomer.accepts_marketing,
                addressLine1: shopifyCustomer.addresses[0]?.address1 || null,
                addressLine2: shopifyCustomer.addresses[0]?.address2 || null,
                city: shopifyCustomer.addresses[0]?.city || null,
                state: shopifyCustomer.addresses[0]?.province || null,
                zip: shopifyCustomer.addresses[0]?.zip || null,
              },
            });
            imported++;
          }
        } catch (error: any) {
          errors.push(`Customer ${shopifyCustomer.email}: ${error.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.slice(0, 10), // Limit errors to first 10
    });
  } catch (error: any) {
    console.error("Shopify import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import from Shopify" },
      { status: 500 }
    );
  }
}
