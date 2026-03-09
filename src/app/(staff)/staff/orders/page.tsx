"use client";

import { useEffect, useMemo, useState } from "react";

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
  created_by_user_id?: string | null;
  location_id?: string | null;
};

const ACTIVE_COLUMNS: { key: string; title: string }[] = [
  { key: "new_design", title: "New / Design" },
  { key: "awaiting_materials", title: "Awaiting Materials" },
  { key: "in_production", title: "In Production" },
  { key: "quality_check", title: "Quality Check" },
  { key: "ready_for_pickup", title: "Ready for Pickup" },
  { key: "completed", title: "Completed" },
];

const COMPLETED_COLUMNS: { key: string; title: string }[] = [
  { key: "on_hold", title: "On Hold" },
  { key: "picked_up", title: "Picked Up" },
  { key: "completed", title: "Completed" },
  { key: "cancelled", title: "Cancelled" },
];

const ALL_COLUMNS: { key: string; title: string }[] = [
  { key: "estimate", title: "Estimates" },
  ...ACTIVE_COLUMNS,
  ...COMPLETED_COLUMNS,
];

type TabType = "active" | "estimates" | "all";

export default function OrdersBoardPage() {
  const [orders, setOrders] = useState<OrderCard[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search & filter state
  const [searchQ, setSearchQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterItemType, setFilterItemType] = useState("");
  const [filterStaff, setFilterStaff] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  
  // Load staff and locations for filters
  const [staffUsers, setStaffUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  
  useEffect(() => {
    Promise.all([
      fetch("/staff/api/users").then(r => r.json()).then(d => setStaffUsers(d.users || [])),
      fetch("/staff/api/locations").then(r => r.json()).then(d => setLocations(d.locations || [])),
    ]).catch(console.error);
  }, []);

  async function load() {
    setErr(null);
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (searchQ.trim()) params.set("q", searchQ.trim());
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (filterItemType) params.set("item_type", filterItemType);
    if (filterStaff) params.set("createdByUserId", filterStaff);
    if (filterLocation) params.set("locationId", filterLocation);

    try {
      const res = await fetch(`/staff/api/orders?${params}`, { cache: "no-store" });
      const out = await res.json();
      if (!res.ok) {
        setErr(out.error || "Failed to load orders");
        return;
      }
      setOrders(out.orders || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [searchQ, dateFrom, dateTo, filterItemType, filterStaff, filterLocation]);

  const [draggedOrder, setDraggedOrder] = useState<OrderCard | null>(null);

  const currentColumns = useMemo(() => {
    if (activeTab === "estimates") return [{ key: "estimate", title: "Estimates" }];
    if (activeTab === "active") return ACTIVE_COLUMNS;
    return ALL_COLUMNS;
  }, [activeTab]);

  const grouped = useMemo(() => {
    const m = new Map<string, OrderCard[]>();
    for (const c of currentColumns) m.set(c.key, []);
    for (const o of orders) if (m.has(o.status)) m.get(o.status)!.push(o);
    return m;
  }, [orders, currentColumns]);

  const estimateCount = useMemo(() => orders.filter((o) => o.status === "estimate").length, [orders]);

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

  async function activateEstimate(orderId: string) {
    const success = await updateOrderStatus(orderId, "new_design");
    if (success) await load();
  }

  async function handleBulkStatusUpdate() {
    if (!bulkStatus || selectedOrders.size === 0) return;
    if (!confirm(`Update ${selectedOrders.size} order(s) to "${bulkStatus}"?`)) return;

    const res = await fetch("/staff/api/orders/bulk-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderIds: Array.from(selectedOrders),
        status: bulkStatus,
      }),
    });

    if (res.ok) {
      setSelectedOrders(new Set());
      setBulkStatus("");
      await load();
    } else {
      const out = await res.json();
      alert(out.error || "Failed to update orders");
    }
  }

  function isOverdue(order: OrderCard): boolean {
    if (!order.due_date) return false;
    const dueDate = new Date(order.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today && !["completed", "cancelled", "picked_up"].includes(order.status);
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

  const gridCols = activeTab === "estimates"
    ? "md:grid-cols-1 max-w-2xl"
    : activeTab === "all"
      ? "md:grid-cols-5 lg:grid-cols-10"
      : "md:grid-cols-5";

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900">Orders</h1>
        <div className="flex flex-wrap gap-2">
          <a
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100"
            href="/staff/orders/new"
          >
            New order
          </a>
          <button
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-900 bg-white hover:bg-neutral-100"
            onClick={load}
          >
            Refresh
          </button>
          <button
            className="rounded-xl border border-blue-300 px-4 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true);
              try {
                const res = await fetch("/staff/api/orders/invoice/sync-all", { method: "POST" });
                const out = await res.json().catch(() => ({}));
                if (!res.ok) {
                  alert(out.error || "Sync failed");
                  return;
                }
                alert(out.message || `Synced ${out.synced} invoice(s).`);
                await load();
              } catch (e) {
                alert("Sync failed");
              } finally {
                setSyncing(false);
              }
            }}
          >
            {syncing ? "Syncing…" : "Sync all invoices"}
          </button>
        </div>
      </div>

      {err ? <div className="text-sm text-red-400">{err}</div> : null}
      
      {loading && orders.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mb-2"></div>
          <div>Loading orders...</div>
        </div>
      ) : null}

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search orders, customers, phone…"
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
        <div>
          <label className="block text-[11px] text-neutral-500 mb-1">Item type</label>
          <select
            value={filterItemType}
            onChange={(e) => setFilterItemType(e.target.value)}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900"
          >
            <option value="">All types</option>
            <option value="art">Art / Print</option>
            <option value="photo">Photo</option>
            <option value="diploma">Diploma / Certificate</option>
            <option value="object">Object / Shadowbox</option>
            <option value="memorabilia">Memorabilia / Jersey</option>
            <option value="mirror">Mirror</option>
            <option value="canvas">Canvas</option>
            <option value="restoration">Restoration</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-neutral-500 mb-1">Staff</label>
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900"
          >
            <option value="">All staff</option>
            {staffUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-neutral-500 mb-1">Location</label>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900"
          >
            <option value="">All locations</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        {(searchQ || dateFrom || dateTo || filterItemType || filterStaff || filterLocation) && (
          <button
            onClick={() => { 
              setSearchQ(""); 
              setDateFrom(""); 
              setDateTo(""); 
              setFilterItemType(""); 
              setFilterStaff(""); 
              setFilterLocation(""); 
            }}
            className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            Clear
          </button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-blue-900">
            {selectedOrders.size} order{selectedOrders.size !== 1 ? "s" : ""} selected
          </div>
          <div className="flex items-center gap-3">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm"
            >
              <option value="">Select status...</option>
              {ACTIVE_COLUMNS.map(col => (
                <option key={col.key} value={col.key}>{col.title}</option>
              ))}
            </select>
            <button
              onClick={handleBulkStatusUpdate}
              disabled={!bulkStatus}
              className="rounded-lg bg-blue-600 text-white px-4 py-1.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              Update Status
            </button>
            <button
              onClick={async () => {
                if (!confirm(`Are you sure you want to delete ${selectedOrders.size} order(s)?\n\nThis action cannot be undone.`)) return;
                
                try {
                  const deletePromises = Array.from(selectedOrders).map(orderId =>
                    fetch(`/staff/api/orders/${orderId}`, { method: "DELETE" })
                  );
                  const results = await Promise.all(deletePromises);
                  const failed = results.filter(r => !r.ok);
                  
                  if (failed.length > 0) {
                    alert(`Failed to delete ${failed.length} order(s). Please try again.`);
                  } else {
                    setSelectedOrders(new Set());
                    await load();
                  }
                } catch (e) {
                  alert("Failed to delete orders. Please try again.");
                }
              }}
              className="rounded-lg bg-red-600 text-white px-4 py-1.5 text-sm font-semibold hover:bg-red-700"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedOrders(new Set())}
              className="rounded-lg border border-blue-300 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-300">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "active"
            ? "text-neutral-900 border-b-2 border-neutral-900"
            : "text-neutral-600 hover:text-neutral-900"
            }`}
        >
          Active Orders
        </button>
        <button
          onClick={() => setActiveTab("estimates")}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${activeTab === "estimates"
            ? "text-neutral-900 border-b-2 border-neutral-900"
            : "text-neutral-600 hover:text-neutral-900"
            }`}
        >
          Estimates
          {estimateCount > 0 && (
            <span className="rounded-full bg-red-100 text-red-700 text-xs px-2 py-0.5 font-semibold">
              {estimateCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "all"
            ? "text-neutral-900 border-b-2 border-neutral-900"
            : "text-neutral-600 hover:text-neutral-900"
            }`}
        >
          All Orders
        </button>
        <a
          href="/staff/orders/completed"
          className="px-4 py-2 text-sm font-medium transition-colors text-neutral-600 hover:text-neutral-900"
        >
          Completed Orders
        </a>
      </div>

      <div className={`grid gap-4 overflow-x-auto pb-4 ${gridCols}`} style={{ gridAutoColumns: "minmax(240px, 1fr)", gridAutoFlow: activeTab === "estimates" ? undefined : "column" }}>
        {currentColumns.map((col) => (
          <div
            key={col.key}
            className={`rounded-2xl border p-4 transition-colors ${
              col.key === "estimate" ? "border-red-200 bg-red-50/50" :
              col.key === "on_hold" ? "border-orange-200 bg-orange-50/50" :
              draggedOrder && draggedOrder.status !== col.key
                ? "border-blue-300 bg-blue-50"
                : "border-neutral-200 bg-neutral-50"
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className={`font-semibold mb-3 flex items-center justify-between ${
              col.key === "estimate" ? "text-red-800" :
              col.key === "on_hold" ? "text-orange-800" :
              "text-neutral-900"
            }`}>
              <span>
                {col.title}
                <span className="text-xs font-normal ml-2 text-neutral-500">
                  ({(grouped.get(col.key) || []).length})
                </span>
              </span>
              {col.key === "ready_for_pickup" && (
                <button
                  onClick={async () => {
                    const readyOrders = grouped.get("ready_for_pickup") || [];
                    if (readyOrders.length === 0) return;
                    
                    if (!confirm(`Mark all ${readyOrders.length} order(s) in "Ready for Pickup" as Completed?`)) return;
                    
                    try {
                      const updatePromises = readyOrders.map(order =>
                        updateOrderStatus(order.id, "completed")
                      );
                      const results = await Promise.all(updatePromises);
                      const failed = results.filter(r => !r);
                      
                      if (failed.length > 0) {
                        alert(`Failed to complete ${failed.length} order(s). Please try again.`);
                      } else {
                        await load();
                      }
                    } catch (e) {
                      alert("Failed to complete orders. Please try again.");
                    }
                  }}
                  className="rounded-lg bg-green-600 text-white px-3 py-1 text-xs font-semibold hover:bg-green-700 transition-colors"
                  title="Mark all ready orders as completed"
                >
                  Complete All
                </button>
              )}
            </div>

            <div className="space-y-3 min-h-[100px]">
              {(grouped.get(col.key) || []).map((o) => {
                const overdue = isOverdue(o);
                return (
                <div
                  key={o.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, o)}
                  onDragEnd={handleDragEnd}
                  className={`rounded-2xl border p-4 transition-all overflow-hidden cursor-move ${
                    draggedOrder?.id === o.id
                      ? "opacity-50 border-blue-400 bg-blue-50"
                      : overdue
                        ? "border-red-400 bg-red-50 hover:bg-red-100 hover:border-red-500 shadow-md"
                        : o.status === "estimate"
                          ? "border-red-200 bg-white hover:bg-red-50 hover:border-red-300 shadow-sm"
                          : o.status === "on_hold"
                            ? "border-orange-200 bg-white hover:bg-orange-50 hover:border-orange-300 shadow-sm"
                            : "border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(o.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        const newSet = new Set(selectedOrders);
                        if (e.target.checked) {
                          newSet.add(o.id);
                        } else {
                          newSet.delete(o.id);
                        }
                        setSelectedOrders(newSet);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <a
                      href={`/staff/orders/${o.id}`}
                      onClick={(e) => {
                        if (draggedOrder?.id === o.id) e.preventDefault();
                      }}
                      className="flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-neutral-900 font-semibold">{o.order_number}</div>
                        {overdue && (
                          <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      <div className="text-neutral-500 text-sm truncate">{o.customer_name}</div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded-full border border-neutral-300 px-2 py-1 text-neutral-600 max-w-full truncate">
                        {o.item_type}
                      </span>
                      {o.status === "estimate" ? (
                        <span className="rounded-full border border-red-300 px-2 py-1 text-red-700 bg-red-50">
                          Estimate
                        </span>
                      ) : o.status === "on_hold" ? (
                        <span className="rounded-full border border-orange-300 px-2 py-1 text-orange-700 bg-orange-50">
                          On Hold
                        </span>
                      ) : (
                        <span
                          className={[
                            "rounded-full border px-2 py-1",
                            o.paid_status === "paid"
                              ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                              : o.paid_status === "deposit"
                                ? "border-blue-300 text-blue-700 bg-blue-50"
                                : "border-amber-300 text-amber-700 bg-amber-50",
                          ].join(" ")}
                        >
                          {o.paid_status === "paid"
                            ? "Paid"
                            : o.paid_status === "deposit"
                              ? "Deposit received"
                              : "Unpaid"}
                        </span>
                      )}
                      <span className="ml-auto text-neutral-900 font-semibold text-sm md:text-base">
                        ${(o.total_cents / 100).toFixed(2)}
                      </span>
                    </div>
                    </a>
                  </div>
                  {/* Activate button for estimates */}
                  {o.status === "estimate" && (
                    <button
                      className="mt-2 w-full rounded-lg bg-emerald-600 text-white text-xs py-1.5 font-medium hover:bg-emerald-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Activate this estimate? It will become an active order.")) {
                          activateEstimate(o.id);
                        }
                      }}
                    >
                      Activate → New Order
                    </button>
                  )}
                  {/* Complete button for ready_for_pickup */}
                  {o.status === "ready_for_pickup" && (
                    <button
                      className="mt-2 w-full rounded-lg bg-green-600 text-white text-xs py-1.5 font-medium hover:bg-green-700 transition-colors"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Mark order ${o.order_number} as Completed?`)) {
                          const success = await updateOrderStatus(o.id, "completed");
                          if (success) await load();
                        }
                      }}
                    >
                      Complete
                    </button>
                  )}
                </div>
              )})}

              {(grouped.get(col.key) || []).length === 0 ? (
                <div className="text-sm text-neutral-400 py-4 text-center">
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
