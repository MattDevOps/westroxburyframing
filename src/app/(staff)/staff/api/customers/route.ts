import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { normalizeEmail, normalizePhone } from "@/lib/ids";
import { syncMailchimpCustomer } from "@/lib/mailchimp";

/**
 * GET /staff/api/customers?q=
 * List + search customers (for Customers page)
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const tagId = url.searchParams.get("tagId");
  const emailsParam = url.searchParams.get("emails");

  const where: any = {};
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }
  if (emailsParam) {
    // Search by specific email addresses (comma-separated)
    const emails = emailsParam.split(",").map(e => e.trim().toLowerCase()).filter(e => e.length > 0);
    if (emails.length > 0) {
      where.email = {
        in: emails,
      };
    }
  }
  if (tagId) {
    where.tagAssignments = {
      some: {
        tagId,
      },
    };
  }

  try {
    // Try to include tagAssignments, but fall back if Prisma client isn't updated yet
    const includeOptions: any = {
      _count: { select: { orders: true } },
    };

    // Only include tagAssignments if the Prisma client supports it
    // This will work after running `npx prisma generate` and restarting the dev server
    try {
      // Test if tagAssignments exists by checking the model
      includeOptions.tagAssignments = {
        include: {
          tag: true,
        },
      };
    } catch {
      // Prisma client not updated yet - skip tagAssignments
    }

    const customers = await prisma.customer.findMany({
      where: Object.keys(where).length > 0 ? where : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      include: includeOptions,
    });

    // If tagAssignments weren't included, fetch them separately
    if (!customers[0] || !('tagAssignments' in customers[0])) {
      const customerIds = customers.map(c => c.id);
      const tagAssignments = await prisma.customerTagAssignment.findMany({
        where: { customerId: { in: customerIds } },
        include: { tag: true },
      });

      // Group by customer ID
      const assignmentsByCustomer = new Map<string, typeof tagAssignments>();
      for (const assignment of tagAssignments) {
        if (!assignmentsByCustomer.has(assignment.customerId)) {
          assignmentsByCustomer.set(assignment.customerId, []);
        }
        assignmentsByCustomer.get(assignment.customerId)!.push(assignment);
      }

      // Add tagAssignments to each customer
      for (const customer of customers) {
        (customer as any).tagAssignments = assignmentsByCustomer.get(customer.id) || [];
      }
    }

    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    
    // If it's a Prisma validation error about tagAssignments, try without it
    if (error.message && error.message.includes('tagAssignments')) {
      try {
        const customers = await prisma.customer.findMany({
          where: Object.keys(where).length > 0 ? where : {},
          orderBy: { createdAt: "desc" },
          take: 200,
          include: {
            _count: { select: { orders: true } },
          },
        });

        // Fetch tagAssignments separately
        const customerIds = customers.map(c => c.id);
        const tagAssignments = await prisma.customerTagAssignment.findMany({
          where: { customerId: { in: customerIds } },
          include: { tag: true },
        });

        const assignmentsByCustomer = new Map<string, typeof tagAssignments>();
        for (const assignment of tagAssignments) {
          if (!assignmentsByCustomer.has(assignment.customerId)) {
            assignmentsByCustomer.set(assignment.customerId, []);
          }
          assignmentsByCustomer.get(assignment.customerId)!.push(assignment);
        }

        for (const customer of customers) {
          (customer as any).tagAssignments = assignmentsByCustomer.get(customer.id) || [];
        }

        return NextResponse.json({ customers });
      } catch (fallbackError: any) {
        console.error("Fallback query also failed:", fallbackError);
        return NextResponse.json(
          { error: fallbackError.message || "Failed to load customers" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: error.message || "Failed to load customers" },
      { status: 500 }
    );
  }
}

/**
 * POST /staff/api/customers
 * Create or find-and-update customer.
 *
 * Duplicate prevention:
 *  1. If email matches an existing record → return that record (update it with any new info).
 *  2. If phone matches an existing record → return that record (update it with any new info).
 *  3. If email matches record A but phone matches record B → return 409 conflict.
 *  4. Otherwise → create a new customer.
 *
 * Response includes `existing: true` when an existing record was found, so the
 * front-end can show a "customer already exists" notice.
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const phone = normalizePhone(String(body.phone || ""));
  const email = normalizeEmail(body.email);
  const firstName = String(body.first_name || "").trim();
  const lastName = String(body.last_name || "").trim();
  const marketing = Boolean(body.marketing_opt_in);
  const addressLine1 = "address_line1" in body ? String(body.address_line1 || "").trim() || null : undefined;
  const addressLine2 = "address_line2" in body ? String(body.address_line2 || "").trim() || null : undefined;
  const city = "city" in body ? String(body.city || "").trim() || null : undefined;
  const state = "state" in body ? String(body.state || "").trim() || null : undefined;
  const zip = "zip" in body ? String(body.zip || "").trim() || null : undefined;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  }

  if (!phone && !email) {
    return NextResponse.json({ error: "Phone or email is required." }, { status: 400 });
  }

  // ── Look for existing customers by email and phone ──
  const byEmail = email
    ? await prisma.customer.findFirst({ where: { email } })
    : null;

  const byPhone = phone
    ? await prisma.customer.findFirst({ where: { phone } })
    : null;

  // Conflict: email and phone each match DIFFERENT existing records
  if (byEmail && byPhone && byEmail.id !== byPhone.id) {
    return NextResponse.json(
      {
        error: `Duplicate conflict: email "${email}" belongs to ${byEmail.firstName} ${byEmail.lastName}, but phone "${phone}" belongs to ${byPhone.firstName} ${byPhone.lastName}. Please verify which customer this is.`,
        emailMatch: { id: byEmail.id, name: `${byEmail.firstName} ${byEmail.lastName}` },
        phoneMatch: { id: byPhone.id, name: `${byPhone.firstName} ${byPhone.lastName}` },
      },
      { status: 409 }
    );
  }

  // Existing record found (by email or phone) — update and return it
  const existing = byEmail || byPhone;
  if (existing) {
    const updateData: Record<string, unknown> = {
      firstName: firstName || existing.firstName,
      lastName: lastName || existing.lastName,
      preferredContact: body.preferred_contact === "call" ? "call" : "email",
      marketingOptIn: marketing,
    };
    if (marketing && !existing.marketingOptInAt) updateData.marketingOptInAt = new Date();
    // Fill in phone or email if not already set
    if (phone && !existing.phone) updateData.phone = phone;
    if (email && !existing.email) updateData.email = email;
    // Update address fields if provided
    if (addressLine1 !== undefined) updateData.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) updateData.addressLine2 = addressLine2;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zip !== undefined) updateData.zip = zip;

    const updated = await prisma.customer.update({
      where: { id: existing.id },
      data: updateData,
    });

    if (marketing) {
      syncMailchimpCustomer(updated).catch(() => null);
    }

    return NextResponse.json({
      customer: { id: updated.id },
      existing: true,
      message: `Existing customer found: ${updated.firstName} ${updated.lastName}${updated.email ? ` (${updated.email})` : ""}. Record updated.`,
    });
  }

  // ── No match — create new customer ──
  const customer = await prisma.customer.create({
    data: {
      firstName,
      lastName,
      phone: phone ? phone : null,
      email: email ? email : null,
      addressLine1: addressLine1 || null,
      addressLine2: addressLine2 || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      preferredContact: body.preferred_contact === "call" ? "call" : "email",
      marketingOptIn: marketing,
      marketingOptInAt: marketing ? new Date() : null,
    },
  });

  if (marketing) {
    syncMailchimpCustomer(customer).catch(() => null);
  }

  return NextResponse.json({ customer: { id: customer.id } });
}
