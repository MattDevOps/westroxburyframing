"use client";

import Link from "next/link";
import { useEffect, useState, useMemo, useCallback } from "react";

type Order = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  total_cents: number;
  paid: boolean;
  paid_status: string;
  item_type: string;
  due_date: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  estimate: "Estimate",
  new_design: "New / Design",
  awaiting_materials: "Awaiting Materials",
  in_production: "In Production",
  quality_check: "Quality Check",
  ready_for_pickup: "Ready for Pickup",
  on_hold: "On Hold",
};

const STATUS_COLOR: Record<string, string> = {
  new_design: "bg-blue-100 text-blue-700 border-blue-200",
  awaiting_materials: "bg-amber-100 text-amber-700 border-amber-200",
  in_production: "bg-purple-100 text-purple-700 border-purple-200",
  quality_check: "bg-indigo-100 text-indigo-700 border-indigo-200",
  ready_for_pickup: "bg-emerald-100 text-emerald-700 border-emerald-200",
  on_hold: "bg-orange-100 text-orange-700 border-orange-200",
  estimate: "bg-red-100 text-red-700 border-red-200",
};

const INCOMPLETE_STATUSES = [
  "new_design",
  "awaiting_materials",
  "in_production",
  "quality_check",
  "ready_for_pickup",
  "on_hold",
];

export default function IncompleteOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [searchQ, setSearchQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/staff/api/orders?limit=200", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.orders) {
      // Filter to incomplete orders only
      const incomplete = (data.orders as Order[]).filter((o) =>
        INCOMPLETE_STATUSES.includes(o.status)
      );
      setOrders(incomplete);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = orders;
    if (filterStatus) list = list.filter((o) => o.status === filterStatus);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.item_type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filterStatus, searchQ]);

  const allSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((o) => o.id)));
    }
  }

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function bulkComplete() {
    if (selected.size === 0) return;
    if (!confirm(`Mark ${selected.size} order(s) as Completed?`)) return;

    setBulkProcessing(true);
    setMsg(null);
    try {
      const res = await fetch("/staff/api/orders/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: Array.from(selected),
          status: "completed",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`${data.updated} order(s) marked as completed.`);
        setSelected(new Set());
        await load();
      } else {
        alert(data.error || "Failed to update orders");
      }
    } finally {
      setBulkProcessing(false);
    }
  }

  async function bulkPickedUp() {
    if (selected.size === 0) return;
    if (!confirm(`Mark ${selected.size} order(s) as Picked Up?`)) return;

    setBulkProcessing(true);
    setMsg(null);
    try {
      const res = await fetch("/staff/api/orders/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: Array.from(selected),
          status: "picked_up",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`${data.updated} order(s) marked as picked up.`);
        setSelected(new Set());
        await load();
      } else {
        alert(data.error || "Failed to update orders");
      }
    } finally {
      setBulkProcessing(false);
    }
  }

  async function sendPickupReminder(orderId: string) {
    setSendingReminder(orderId);
    try {
      const res = await fetch(`/staff/api/orders/${orderId}/pickup-reminder`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`Pickup reminder sent to ${data.sentTo}`);
      } else {
        alert(data.error || "Failed to send reminder");
      }
    } catch {
      alert("Failed to send reminder");
    } finally {
      setSendingReminder(null);
    }
  }

  // Count by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [orders]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Incomplete Orders</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {orders.length} order{orders.length !== 1 ? "s" : ""} still in progress
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/staff/orders"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100"
          >
            Kanban Board
          </Link>
          <button
            onClick={load}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100"
          >
            Refresh
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {msg}
        </div>
      )}

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus("")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
            !filterStatus ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
          }`}
        >
          All ({orders.length})
        </button>
        {INCOMPLETE_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
              filterStatus === s ? "bg-neutral-900 text-white border-neutral-900" : `${STATUS_COLOR[s] || "bg-white text-neutral-700 border-neutral-300"} hover:opacity-80`
            }`}
          >
            {STATUS_LABEL[s] || s} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search orders, customers…"
        value={searchQ}
        onChange={(e) => setSearchQ(e.target.value)}
        className="w-full max-w-sm rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400"
      />

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <span className="text-sm font-medium text-blue-800">
            {selected.size} selected
          </span>
          <button
            onClick={bulkComplete}
            disabled={bulkProcessing}
            className="rounded-lg bg-green-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {bulkProcessing ? "Processing…" : "Mark Complete"}
          </button>
          <button
            onClick={bulkPickedUp}
            disabled={bulkProcessing}
            className="rounded-lg bg-teal-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {bulkProcessing ? "Processing…" : "Mark Picked Up"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-lg border border-neutral-300 text-neutral-700 px-3 py-1.5 text-xs hover:bg-neutral-100"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Orders table */}
      {loading ? (
        <div className="text-sm text-neutral-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-neutral-500 py-8 text-center">
          {orders.length === 0 ? "No incomplete orders. Great job!" : "No orders match your filters."}
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 bg-neutral-50 px-4 py-3 text-xs font-medium text-neutral-600">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="rounded"
              />
            </div>
            <div className="col-span-2">Order</div>
            <div className="col-span-2">Customer</div>
            <div className="col-span-1">Item</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1">Payment</div>
            <div className="col-span-1">Due</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {filtered.map((o) => {
            const isReady = o.status === "ready_for_pickup";
            const hasEmail = !!o.customer_email;

            return (
              <div
                key={o.id}
                className={`grid grid-cols-12 gap-2 px-4 py-3 text-sm border-t border-neutral-200 items-center ${
                  selected.has(o.id) ? "bg-blue-50" : "hover:bg-neutral-50"
                }`}
              >
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selected.has(o.id)}
                    onChange={() => toggle(o.id)}
                    className="rounded"
                  />
                </div>
                <div className="col-span-2">
                  <Link href={`/staff/orders/${o.id}`} className="font-medium text-blue-700 hover:underline">
                    {o.order_number}
                  </Link>
                </div>
                <div className="col-span-2 text-neutral-700 truncate">{o.customer_name}</div>
                <div className="col-span-1 text-neutral-600 truncate text-xs">{o.item_type}</div>
                <div className="col-span-1">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${STATUS_COLOR[o.status] || "bg-neutral-100 text-neutral-600 border-neutral-200"}`}>
                    {STATUS_LABEL[o.status] || o.status}
                  </span>
                </div>
                <div className="col-span-1 text-right font-medium">${(o.total_cents / 100).toFixed(2)}</div>
                <div className="col-span-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      o.paid_status === "paid"
                        ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                        : o.paid_status === "deposit"
                          ? "border-blue-200 text-blue-700 bg-blue-50"
                          : "border-amber-200 text-amber-700 bg-amber-50"
                    }`}
                  >
                    {o.paid_status === "paid" ? "Paid" : o.paid_status === "deposit" ? "Deposit" : "Unpaid"}
                  </span>
                </div>
                <div className="col-span-1 text-xs text-neutral-500">
                  {o.due_date ? new Date(o.due_date).toLocaleDateString() : "—"}
                </div>
                <div className="col-span-2 flex gap-1 justify-end">
                  {isReady && hasEmail && (
                    <button
                      onClick={() => sendPickupReminder(o.id)}
                      disabled={sendingReminder === o.id}
                      className="rounded-lg border border-emerald-300 px-2 py-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50"
                      title="Send pickup reminder email"
                    >
                      {sendingReminder === o.id ? "Sending…" : "📧 Pickup"}
                    </button>
                  )}
                  {isReady && !hasEmail && (
                    <span className="text-xs text-neutral-400 italic" title="No email on file">No email</span>
                  )}
                  <Link
                    href={`/staff/orders/${o.id}`}
                    className="rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
