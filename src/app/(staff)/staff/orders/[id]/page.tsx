"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const STATUS_FLOW = [
  "new_design",
  "awaiting_materials",
  "in_production",
  "quality_check",
  "ready_for_pickup",
  "picked_up",
  "completed",
] as const;

const STATUS_LABEL: Record<string, string> = {
  new_design: "New / Design",
  awaiting_materials: "Awaiting Materials",
  in_production: "In Production",
  quality_check: "Quality Check",
  ready_for_pickup: "Ready for Pickup",
  picked_up: "Picked Up",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");
  const [data, setData] = useState<any>(null);

  async function refresh() {
    if (!id) return;
    const out = await fetch(`/staff/api/orders/${id}`, { cache: "no-store" }).then((r) => r.json());
    setData(out);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!data?.order) return <div className="p-6 text-neutral-300">Loading...</div>;
  const order = data.order;

  async function setStatus(next: string) {
    const res = await fetch(`/staff/api/orders/${order.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const out = await res.json();
    if (!res.ok) return alert(out.error || "Failed to update status");
    await refresh();
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{order.orderNumber}</h1>
          <div className="text-neutral-400">
            {order.customer.firstName} {order.customer.lastName}
          </div>
        </div>
        <a
          className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
          href="/staff/orders"
        >
          Back to orders
        </a>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
            value={order.status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            className="rounded-xl border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
            onClick={() => {
              const idx = STATUS_FLOW.indexOf(order.status);
              if (idx < 0 || idx === STATUS_FLOW.length - 1) return;
              setStatus(STATUS_FLOW[idx + 1]);
            }}
          >
            Next stage →
          </button>

          <button
            className="rounded-xl border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
            onClick={() => {
              const idx = STATUS_FLOW.indexOf(order.status);
              if (idx <= 0) return;
              setStatus(STATUS_FLOW[idx - 1]);
            }}
          >
            ← Back
          </button>
        </div>

        <div className="text-neutral-200">
          <span className="font-medium">Item:</span> {order.itemType}
        </div>
        <div className="text-neutral-200">
          <span className="font-medium">Total:</span> ${(order.totalAmount / 100).toFixed(2)}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-5 space-y-3">
        <div className="text-white font-semibold">Payment</div>
        <button
          className="rounded-xl bg-white text-black px-4 py-2 text-sm hover:bg-neutral-200"
          onClick={async () => {
            const res = await fetch(`/staff/api/orders/${order.id}/payments/create`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount_cents: order.totalAmount }),
            });
            const out = await res.json();
            alert(res.ok ? "Payment attached (Square stub). Check logs for details." : out.error || "Error");
            await refresh();
          }}
        >
          Take Payment (Square)
        </button>
      </div>
    </div>
  );
}
