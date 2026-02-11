export const ORDER_STATUSES = [
    "new",
    "design",
    "materials_ordered",
    "in_production",
    "ready_for_pickup",
    "completed",
    "cancelled",
  ] as const;
  
  export type OrderStatus = (typeof ORDER_STATUSES)[number];
  
  export function isValidOrderStatus(s: string): s is OrderStatus {
    return (ORDER_STATUSES as readonly string[]).includes(s);
  }
  
  export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
    new: "New",
    design: "Design",
    materials_ordered: "Materials Ordered",
    in_production: "In Production",
    ready_for_pickup: "Ready for Pickup",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  