export const ORDER_STATUSES = [
  "estimate",
  "new_design",
  "awaiting_materials",
  "in_production",
  "quality_check",
  "ready_for_pickup",
  "on_hold",
  "picked_up",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isValidOrderStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(s);
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  estimate: "Estimate",
  new_design: "New / Design",
  awaiting_materials: "Awaiting Materials",
  in_production: "In Production",
  quality_check: "Quality Check",
  ready_for_pickup: "Ready for Pickup",
  on_hold: "On Hold",
  picked_up: "Picked Up",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Statuses considered "active" (work in progress, not completed/cancelled/estimate) */
export const ACTIVE_STATUSES: OrderStatus[] = [
  "new_design",
  "awaiting_materials",
  "in_production",
  "quality_check",
  "ready_for_pickup",
];

/** Statuses considered "incomplete" (not done yet — used for incomplete orders list) */
export const INCOMPLETE_STATUSES: OrderStatus[] = [
  "new_design",
  "awaiting_materials",
  "in_production",
  "quality_check",
  "ready_for_pickup",
  "on_hold",
];
