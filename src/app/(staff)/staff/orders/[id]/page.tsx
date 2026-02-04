"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/staff/api/orders/${id}`).then((r) => r.json()).then(setData);
  }, [id]);

  if (!data?.order) return <div>Loading...</div>;
  const order = data.order;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
          <div className="text-neutral-600">
            {order.customer.firstName} {order.customer.lastName}
          </div>
        </div>
        <a className="rounded-xl border border-neutral-300 px-4 py-2" href="/staff">
          Back
        </a>
      </div>

      <div className="rounded-2xl border border-neutral-200 p-5 space-y-2">
        <div>
          <span className="font-medium">Status:</span> {order.status}
        </div>
        <div>
          <span className="font-medium">Item:</span> {order.itemType}
        </div>
        <div>
          <span className="font-medium">Total:</span> ${(order.totalAmount / 100).toFixed(2)}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 p-5">
        <button
          className="rounded-xl bg-black px-4 py-2 text-white"
          onClick={async () => {
            const res = await fetch(`/staff/api/orders/${id}/payments/create`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount_cents: order.totalAmount }),
            });
            const out = await res.json();
            alert(res.ok ? "Payment attached (stub). Check server logs / Square config." : out.error || "Error");
          }}
        >
          Take Payment (Square)
        </button>
      </div>
    </div>
  );
}
