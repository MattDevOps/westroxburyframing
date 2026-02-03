"use client";

import { useEffect, useMemo, useState } from "react";

const columns = [
  { key: "new_design", label: "New / Design" },
  { key: "awaiting_materials", label: "Awaiting Materials" },
  { key: "in_production", label: "In Production" },
  { key: "quality_check", label: "Quality Check" },
  { key: "ready_for_pickup", label: "Ready for Pickup" },
  { key: "picked_up", label: "Picked Up" }
];

export default function KanbanBoard() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch("/staff/api/orders?limit=200").then(r => r.json()).then(d => setOrders(d.orders || []));
  }, []);

  const byStatus = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const c of columns) map[c.key] = [];
    for (const o of orders) {
      (map[o.status] ||= []).push(o);
    }
    return map;
  }, [orders]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {columns.map(col => (
        <div key={col.key} className="rounded-2xl border border-neutral-200 p-3 bg-white">
          <div className="font-medium text-sm mb-2">{col.label}</div>
          <div className="space-y-2">
            {(byStatus[col.key] || []).map(o => (
              <a key={o.id} href={`/staff/orders/${o.id}`} className="block rounded-xl border border-neutral-200 p-3 hover:bg-neutral-50">
                <div className="text-sm font-medium">{o.order_number}</div>
                <div className="text-xs text-neutral-600">{o.customer_name}</div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="rounded-full border px-2 py-0.5">{o.item_type}</span>
                  <span className="rounded-full border px-2 py-0.5">{o.paid ? "Paid" : "Unpaid"}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
