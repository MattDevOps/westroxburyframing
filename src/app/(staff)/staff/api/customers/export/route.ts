import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/customers/export?format=csv|json
 * Export the full customer list as CSV or JSON.
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "csv";

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      zip: true,
      preferredContact: true,
      marketingOptIn: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });

  if (format === "json") {
    const timestamp = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), count: customers.length, customers }, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="customers-${timestamp}.json"`,
      },
    });
  }

  // Default: CSV
  const csvRows: string[] = [];
  csvRows.push(
    [
      "ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Address Line 1",
      "Address Line 2",
      "City",
      "State",
      "Zip",
      "Preferred Contact",
      "Marketing Opt-In",
      "Order Count",
      "Created At",
    ].join(",")
  );

  for (const c of customers) {
    csvRows.push(
      [
        esc(c.id),
        esc(c.firstName),
        esc(c.lastName),
        esc(c.email),
        esc(c.phone),
        esc(c.addressLine1),
        esc(c.addressLine2),
        esc(c.city),
        esc(c.state),
        esc(c.zip),
        esc(c.preferredContact),
        c.marketingOptIn ? "Yes" : "No",
        String(c._count.orders),
        c.createdAt.toISOString(),
      ].join(",")
    );
  }

  const timestamp = new Date().toISOString().slice(0, 10);

  return new Response(csvRows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${timestamp}.csv"`,
    },
  });
}

/** Escape a CSV field */
function esc(value: string | null | undefined): string {
  if (!value) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
