"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: { id: string; name: string; code: string };
  status: string;
  totalAmount: number;
  orderedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  lines: Array<{
    id: string;
    vendorItemNumber: string;
    description: string | null;
    quantityOrdered: number;
    quantityReceived: number;
    unitCost: number;
    lineTotal: number;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-700 border-neutral-300",
  sent: "bg-blue-50 text-blue-700 border-blue-300",
  partial: "bg-amber-50 text-amber-700 border-amber-300",
  received: "bg-emerald-50 text-emerald-700 border-emerald-300",
  cancelled: "bg-red-50 text-red-700 border-red-300",
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  async function loadOrders() {
    setLoading(true);
    setError(null);
    try {
      const url =
        statusFilter === "all"
          ? "/staff/api/purchase-orders"
          : `/staff/api/purchase-orders?status=${statusFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load purchase orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e: any) {
      setError(e.message || "Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Purchase Orders</h1>
          <p className="text-neutral-600 text-sm mt-1">Manage vendor purchase orders</p>
        </div>
        <Link
          href="/staff/purchase-orders/new"
          className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
        >
          + New PO
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {["all", "draft", "sent", "partial", "received", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === status
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-neutral-600">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <p className="text-neutral-600 mb-4">No purchase orders found</p>
          <Link
            href="/staff/purchase-orders/new"
            className="inline-block rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
          >
            Create your first purchase order
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-700 uppercase">
                  PO Number
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-700 uppercase">
                  Vendor
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-700 uppercase">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-700 uppercase">
                  Total
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-700 uppercase">
                  Ordered
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-700 uppercase">
                  Received
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-700 uppercase">
                  Lines
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {orders.map((po) => (
                <tr key={po.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/staff/purchase-orders/${po.id}`}
                      className="font-mono font-semibold text-neutral-900 hover:text-neutral-600"
                    >
                      {po.poNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{po.vendor.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[po.status] || STATUS_COLORS.draft
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-neutral-900">
                    ${(po.totalAmount / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    {po.orderedAt ? new Date(po.orderedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    {po.receivedAt ? new Date(po.receivedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-neutral-600">
                    {po.lines.length} item{po.lines.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/staff/purchase-orders/${po.id}`}
                      className="text-sm text-neutral-600 hover:text-neutral-900"
                    >
                      View →
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
