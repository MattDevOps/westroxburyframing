"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OrderCard = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  total_cents: number;
  paid: boolean;
  paid_status?: "unpaid" | "deposit" | "paid";
  item_type: string;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
  archived_at?: string | null;
};

export default function CompletedOrdersPage() {
  const [orders, setOrders] = useState<OrderCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  async function load() {
    setError(null);
    setLoading(true);
    const params = new URLSearchParams();
    params.set("status", "completed");
    params.set("includeArchived", "true"); // Always show all completed orders
    params.set("limit", "500");
    if (searchQ.trim()) params.set("q", searchQ.trim());
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);

    try {
      const res = await fetch(`/staff/api/orders?${params}`, { cache: "no-store" });
      const out = await res.json();
      if (!res.ok) {
        setError(out.error || "Failed to load completed orders");
        return;
      }
      setOrders(out.orders || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [searchQ, dateFrom, dateTo]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Completed Orders</h1>
        <Link
          href="/staff/orders"
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100"
        >
          ← Back to Orders
        </Link>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search orders, customers..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] text-neutral-500 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900"
          />
        </div>
        <div>
          <label className="block text-[11px] text-neutral-500 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900"
          />
        </div>
        {(searchQ || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setSearchQ("");
              setDateFrom("");
              setDateTo("");
            }}
            className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            Clear
          </button>
        )}
      </div>

      {loading && orders.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mb-2"></div>
          <div>Loading completed orders...</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">No completed orders found</div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Order #</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Item Type</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-700">Total</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Payment</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Completed</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Archived</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono text-sm font-semibold">{order.order_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.customer_name}</div>
                    {order.customer_email && (
                      <div className="text-xs text-neutral-500">{order.customer_email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">{order.item_type}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    ${(order.total_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "rounded-full border px-2 py-1 text-xs",
                        order.paid_status === "paid"
                          ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                          : order.paid_status === "deposit"
                            ? "border-blue-300 text-blue-700 bg-blue-50"
                            : "border-amber-300 text-amber-700 bg-amber-50",
                      ].join(" ")}
                    >
                      {order.paid_status === "paid"
                        ? "Paid"
                        : order.paid_status === "deposit"
                          ? "Deposit"
                          : "Unpaid"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    {formatDate(order.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {order.archived_at ? (
                      <span className="text-neutral-500">{formatDate(order.archived_at)}</span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/staff/orders/${order.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
