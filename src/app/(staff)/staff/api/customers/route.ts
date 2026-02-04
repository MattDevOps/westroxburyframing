import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { normalizeEmail, normalizePhone } from "@/lib/ids";
import { syncMailchimpCustomer } from "@/lib/mailchimp";

export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const phone = normalizePhone(String(body.phone || ""));
  const email = normalizeEmail(body.email);
  const marketing = Boolean(body.marketing_opt_in);

  if (!phone || String(body.first_name || "").length < 1 || String(body.last_name || "").length < 1) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const customer = await prisma.customer.upsert({
    where: { phone },
    create: {
      firstName: body.first_name,
      lastName: body.last_name,
      phone,
      email,
      preferredContact: body.preferred_contact === "call" ? "call" : "email",
      marketingOptIn: marketing,
      marketingOptInAt: marketing ? new Date() : null,
    },
    update: {
      firstName: body.first_name,
      lastName: body.last_name,
      email,
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
