"use client";

import { useEffect, useMemo, useState } from "react";

type OrderCard = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  total_cents: number;
  paid: boolean;
  item_type: string;
};

const COLUMNS: { key: string; title: string }[] = [
  { key: "new_design", title: "New / Design" },
  { key: "awaiting_materials", title: "Awaiting Materials" },
  { key: "in_production", title: "In Production" },
  { key: "quality_check", title: "Quality Check" },
  { key: "ready_for_pickup", title: "Ready for Pickup" },
];

export default function OrdersBoardPage() {
  const [orders, setOrders] = useState<OrderCard[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const res = await fetch("/staff/api/orders?limit=200", { cache: "no-store" });
    const out = await res.json();
    if (!res.ok) {
      setErr(out.error || "Failed to load orders");
      return;
    }
    setOrders(out.orders || []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  const [draggedOrder, setDraggedOrder] = useState<OrderCard | null>(null);

  const grouped = useMemo(() => {
    const m = new Map<string, OrderCard[]>();
    for (const c of COLUMNS) m.set(c.key, []);
    for (const o of orders) if (m.has(o.status)) m.get(o.status)!.push(o);
    return m;
  }, [orders]);

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const res = await fetch(`/staff/api/orders/${orderId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      const out = await res.json();
      alert(out.error || "Failed to update order status");
      return false;
    }
    return true;
  }

  function handleDragStart(e: React.DragEvent, order: OrderCard) {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", order.id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function handleDrop(e: React.DragEvent, targetStatus: string) {
    e.preventDefault();
    if (!draggedOrder) return;

    if (draggedOrder.status === targetStatus) {
      setDraggedOrder(null);
      return;
    }

    // Optimistically update UI
    setOrders((prev) =>
      prev.map((o) => (o.id === draggedOrder.id ? { ...o, status: targetStatus } : o))
    );

    const success = await updateOrderStatus(draggedOrder.id, targetStatus);
    if (!success) {
      // Revert on failure
      load();
    }
    setDraggedOrder(null);
  }

  function handleDragEnd() {
    setDraggedOrder(null);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-white">Orders</h1>
        <div className="flex gap-2">
          <a
            className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
            href="/staff/orders/new"
          >
            New order
          </a>
          <button
            className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
            onClick={load}
          >
            Refresh
          </button>
        </div>
      </div>

      {err ? <div className="text-sm text-red-400">{err}</div> : null}

      <div className="grid gap-4 md:grid-cols-5">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className={`rounded-2xl border p-4 transition-colors ${
              draggedOrder && draggedOrder.status !== col.key
                ? "border-blue-600 bg-blue-950/20"
                : "border-neutral-800 bg-neutral-950/30"
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="text-white font-semibold mb-3">{col.title}</div>

            <div className="space-y-3 min-h-[100px]">
              {(grouped.get(col.key) || []).map((o) => (
                <div
                  key={o.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, o)}
                  onDragEnd={handleDragEnd}
                  className={`rounded-2xl border p-4 cursor-move transition-all ${
                    draggedOrder?.id === o.id
                      ? "opacity-50 border-blue-500 bg-blue-950/20"
                      : "border-neutral-800 bg-neutral-950/40 hover:bg-neutral-900/40 hover:border-neutral-700"
                  }`}
                >
                  <a
                    href={`/staff/orders/${o.id}`}
                    onClick={(e) => {
                      // Prevent navigation when dragging
                      if (draggedOrder?.id === o.id) {
                        e.preventDefault();
                      }
                    }}
                    className="block"
                  >
                    <div className="text-white font-semibold">{o.order_number}</div>
                    <div className="text-neutral-400 text-sm">{o.customer_name}</div>

                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className="rounded-full border border-neutral-700 px-2 py-1 text-neutral-200">
                        {o.item_type}
                      </span>
                      <span
                        className={[
                          "rounded-full border px-2 py-1",
                          o.paid ? "border-emerald-700 text-emerald-200" : "border-amber-700 text-amber-200",
                        ].join(" ")}
                      >
                        {o.paid ? "Paid" : "Unpaid"}
                      </span>
                      <span className="ml-auto text-neutral-300">
                        ${(o.total_cents / 100).toFixed(2)}
                      </span>
                    </div>
                  </a>
                </div>
              ))}

              {(grouped.get(col.key) || []).length === 0 ? (
                <div className="text-sm text-neutral-500 py-4 text-center">
                  {draggedOrder && draggedOrder.status !== col.key ? "Drop here" : "No orders"}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
