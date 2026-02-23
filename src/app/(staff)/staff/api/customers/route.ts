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

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      preferredContact: true,
      marketingOptIn: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });

  return NextResponse.json({ customers });
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
