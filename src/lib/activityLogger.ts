/**
 * Enhanced activity logging utilities
 */

import { prisma } from "@/lib/db";

export interface ActivityMetadata {
  [key: string]: any;
}

/**
 * Log order activity with enhanced metadata
 */
export async function logOrderActivity(params: {
  orderId: string;
  type: string;
  message: string;
  userId: string;
  metadata?: ActivityMetadata;
}) {
  const { orderId, type, message, userId, metadata = {} } = params;

  // Create in both ActivityLog (legacy) and OrderActivity (timeline)
  await Promise.all([
    prisma.activityLog.create({
      data: {
        entityType: "order",
        entityId: orderId,
        orderId,
        action: type,
        actorUserId: userId,
        metadata: metadata as any,
      },
    }),
    prisma.orderActivity.create({
      data: {
        orderId,
        type,
        message,
        createdByUserId: userId,
      },
    }),
  ]);
}

/**
 * Log order creation with full details
 */
export async function logOrderCreated(params: {
  orderId: string;
  orderNumber: string;
  userId: string;
  customerId: string;
  totalAmount: number;
  status: string;
  metadata?: ActivityMetadata;
}) {
  await logOrderActivity({
    orderId: params.orderId,
    type: "order_created",
    message: `Order ${params.orderNumber} created${params.status === "estimate" ? " as estimate" : ""}`,
    userId: params.userId,
    metadata: {
      orderNumber: params.orderNumber,
      customerId: params.customerId,
      totalAmount: params.totalAmount,
      status: params.status,
      ...params.metadata,
    },
  });
}

/**
 * Log order status change with before/after
 */
export async function logStatusChange(params: {
  orderId: string;
  fromStatus: string;
  toStatus: string;
  userId: string;
  reason?: string;
}) {
  await logOrderActivity({
    orderId: params.orderId,
    type: "status_change",
    message: `Status changed: ${params.fromStatus} → ${params.toStatus}${params.reason ? ` (${params.reason})` : ""}`,
    userId: params.userId,
    metadata: {
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      reason: params.reason,
    },
  });
}

/**
 * Log order edit with changed fields
 */
export async function logOrderEdit(params: {
  orderId: string;
  userId: string;
  changes: Record<string, { from: any; to: any }>;
}) {
  const changeDescriptions = Object.entries(params.changes).map(
    ([field, { from, to }]) => `${field}: ${from} → ${to}`
  );

  await logOrderActivity({
    orderId: params.orderId,
    type: "order_edited",
    message: `Order updated: ${changeDescriptions.join(", ")}`,
    userId: params.userId,
    metadata: {
      changes: params.changes,
    },
  });
}

/**
 * Log payment activity
 */
export async function logPayment(params: {
  orderId: string;
  invoiceId?: string;
  amount: number;
  method: string;
  userId: string;
  squarePaymentId?: string;
}) {
  await logOrderActivity({
    orderId: params.orderId,
    type: "payment",
    message: `Payment received: $${(params.amount / 100).toFixed(2)} via ${params.method}`,
    userId: params.userId,
    metadata: {
      invoiceId: params.invoiceId,
      amount: params.amount,
      method: params.method,
      squarePaymentId: params.squarePaymentId,
    },
  });
}
