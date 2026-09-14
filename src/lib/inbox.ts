import { prisma } from "@/lib/db";

/**
 * File a public web lead (custom-framing form or quote request) in the
 * Customer Inbox so staff can see and reply to it from /staff/inbox.
 *
 * Best-effort by design: the order + staff email are the customer's safety
 * net, so a failed inbox write is logged and never thrown.
 */
export async function fileWebLeadInInbox(params: {
  orderId: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  itemType: string;
  description: string;
  notes: string;
  width?: number | null;
  height?: number | null;
  createdAt?: Date;
}): Promise<void> {
  const body =
    [
      params.itemType ? `Item: ${params.itemType}` : null,
      params.width && params.height ? `Size: ${params.width} x ${params.height} in` : null,
      params.description ? `\nDescription:\n${params.description}` : null,
      params.notes ? `\nNotes:\n${params.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n") || "(No details provided)";

  try {
    await prisma.customerMessage.create({
      data: {
        name: `${params.firstName} ${params.lastName}`.trim(),
        email: params.email || "",
        phone: params.phone || null,
        subject: `Your quote request (${params.orderNumber})`,
        body,
        source: "quote_request",
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        status: "new",
        ...(params.createdAt ? { createdAt: params.createdAt } : {}),
      },
    });
  } catch (e) {
    console.error(`Failed to file web lead ${params.orderNumber} in inbox:`, e);
  }
}
