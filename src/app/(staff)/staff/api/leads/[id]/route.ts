import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { Prisma } from "@prisma/client";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true } },
      convertedCustomer: { select: { id: true, firstName: true, lastName: true, email: true } },
      emails: {
        orderBy: { createdAt: "asc" },
        include: {
          sentBy: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(req: Request, { params }: Params) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Whitelist fields the UI is allowed to update.
  const data: Prisma.LeadUpdateInput = {};
  const stringFields: (keyof Prisma.LeadUpdateInput)[] = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "title",
    "companyName",
    "website",
    "linkedinUrl",
    "city",
    "state",
    "neighborhood",
    "source",
    "notes",
  ];
  for (const f of stringFields) {
    if (f in payload) {
      const v = payload[f as string];
      (data as Record<string, unknown>)[f as string] =
        typeof v === "string" ? v.trim() || null : v === null ? null : undefined;
    }
  }
  if ("vertical" in payload && typeof payload.vertical === "string") {
    data.vertical = payload.vertical as Prisma.LeadUpdateInput["vertical"];
  }
  if ("status" in payload && typeof payload.status === "string") {
    data.status = payload.status as Prisma.LeadUpdateInput["status"];
  }
  if ("assignedToUserId" in payload) {
    const v = payload.assignedToUserId;
    if (v === null || v === "") {
      data.assignedTo = { disconnect: true };
    } else if (typeof v === "string") {
      data.assignedTo = { connect: { id: v } };
    }
  }
  if ("nextFollowUpAt" in payload) {
    const v = payload.nextFollowUpAt;
    data.nextFollowUpAt = typeof v === "string" && v ? new Date(v) : null;
  }
  if ("convertedCustomerId" in payload) {
    const v = payload.convertedCustomerId;
    if (v === null || v === "") {
      data.convertedCustomer = { disconnect: true };
      data.convertedAt = null;
    } else if (typeof v === "string") {
      data.convertedCustomer = { connect: { id: v } };
      data.convertedAt = new Date();
      data.status = "customer";
    }
  }

  try {
    const lead = await prisma.lead.update({ where: { id }, data });
    return NextResponse.json({ lead });
  } catch (e) {
    console.error("Lead update failed:", e);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Lead delete failed:", e);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
