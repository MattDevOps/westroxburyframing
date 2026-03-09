"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserRole } from "@/hooks/useUserRole";

interface PurchaseOrderLine {
  id: string;
  inventoryItemId: string | null;
  inventoryItem: { id: string; sku: string; name: string; unitType: string } | null;
  vendorItemNumber: string;
  description: string | null;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  lineTotal: number;
  notes: string | null;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: { id: string; name: string; code: string; email: string | null; phone: string | null };
  status: string;
  totalAmount: number;
  notes: string | null;
  orderedAt: string | null;
  receivedAt: string | null;
  createdBy: { id: string; name: string };
  createdAt: string;
  lines: PurchaseOrderLine[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-700 border-neutral-300",
  sent: "bg-blue-50 text-blue-700 border-blue-300",
  partial: "bg-amber-50 text-amber-700 border-amber-300",
  received: "bg-emerald-50 text-emerald-700 border-emerald-300",
  cancelled: "bg-red-50 text-red-700 border-red-300",
};

export default function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { isAdmin } = useUserRole();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [receiving, setReceiving] = useState(false);

  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  async function loadOrder() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/staff/api/purchase-orders/${id}`);
      if (!res.ok) throw new Error("Failed to load purchase order");
      const data = await res.json();
      setOrder(data.order);
    } catch (e: any) {
      setError(e.message || "Failed to load purchase order");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    if (!id || !order) return;
    setSaving(true);
    try {
      const res = await fetch(`/staff/api/purchase-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await loadOrder();
    } catch (e: any) {
      alert(e.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  async function handleReceive(receivedLines: Array<{ lineId: string; quantityReceived: number; costPerUnit?: number }>) {
    if (!id) return;
    setReceiving(true);
    try {
      const res = await fetch(`/staff/api/purchase-orders/${id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receivedLines }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to receive items");
      }
      setShowReceive(false);
      await loadOrder();
      alert("Items received and inventory updated!");
    } catch (e: any) {
      alert(e.message || "Failed to receive items");
    } finally {
      setReceiving(false);
    }
  }

  async function handleDelete(removeInventory: boolean = false) {
    if (!id) return;
    
    const isReceived = order?.status === "received" || order?.status === "partial";
    const requiresInventoryConfirm = isReceived && !removeInventory;
    
    if (requiresInventoryConfirm && isAdmin) {
      const confirmed = confirm(
        `⚠️ WARNING: Deleting this ${order?.status} PO will remove all associated inventory entries and revert material quantities.\n\n` +
        `PO: ${order?.poNumber}\n` +
        `Status: ${order?.status}\n\n` +
        `This action cannot be undone. Are you sure?`
      );
      if (!confirmed) return;
    } else if (!requiresInventoryConfirm) {
      const confirmed = confirm(`Are you sure you want to delete purchase order ${order?.poNumber}? This action cannot be undone.`);
      if (!confirmed) return;
    }
    
    setSaving(true);
    try {
      const body = removeInventory || isReceived ? { removeInventory: true } : {};
      const res = await fetch(`/staff/api/purchase-orders/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json();
        if (data.requiresConfirmation) {
          // Re-call with removeInventory=true
          return handleDelete(true);
        }
        throw new Error(data.error || "Failed to delete purchase order");
      }
      router.push("/staff/purchase-orders");
    } catch (e: any) {
      alert(e.message || "Failed to delete purchase order");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-neutral-600">Loading...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error || "Purchase order not found"}
        </div>
        <Link href="/staff/purchase-orders" className="mt-4 inline-block text-sm text-neutral-600 hover:text-neutral-900">
          ← Back to Purchase Orders
        </Link>
      </div>
    );
  }

  const canEdit = order.status === "draft" || order.status === "sent";
  const canReceive = order.status === "sent" || order.status === "partial";
  const allReceived = order.lines.every(
    (line) => Number(line.quantityReceived) >= Number(line.quantityOrdered)
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/staff/purchase-orders" className="text-sm text-neutral-600 hover:text-neutral-900">
          ← Back to Purchase Orders
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 font-mono">{order.poNumber}</h1>
            <p className="text-neutral-600 text-sm mt-1">
              {order.vendor.name} • Created by {order.createdBy.name} •{" "}
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${
                STATUS_COLORS[order.status] || STATUS_COLORS.draft
              }`}
            >
              {order.status}
            </span>
            {(order.status === "draft" || order.status === "cancelled") && (
              <button
                onClick={() => handleDelete()}
                disabled={saving}
                className="rounded-lg border border-red-300 bg-red-50 text-red-700 px-4 py-2 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            )}
            {isAdmin && (order.status === "received" || order.status === "partial") && (
              <button
                onClick={() => handleDelete()}
                disabled={saving}
                className="rounded-lg border border-red-300 bg-red-50 text-red-700 px-4 py-2 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
                title="Admin: Delete & remove inventory"
              >
                {saving ? "Deleting..." : "Delete (Admin)"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status actions */}
      {order.status === "draft" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">This PO is in draft. Send it to the vendor when ready.</p>
            <button
              onClick={() => updateStatus("sent")}
              disabled={saving}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Mark as Sent"}
            </button>
          </div>
        </div>
      )}

      {canReceive && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-emerald-800">
              {allReceived ? "All items received" : "Ready to receive items"}
            </p>
            {!allReceived && (
              <button
                onClick={() => setShowReceive(true)}
                className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700"
              >
                Receive Items
              </button>
            )}
          </div>
        </div>
      )}

      {/* Vendor info */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Vendor Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-neutral-600">Name:</span>
            <span className="ml-2 font-medium text-neutral-900">{order.vendor.name}</span>
          </div>
          <div>
            <span className="text-neutral-600">Code:</span>
            <span className="ml-2 font-mono text-neutral-900">{order.vendor.code}</span>
          </div>
          {order.vendor.email && (
            <div>
              <span className="text-neutral-600">Email:</span>
              <a
                href={`mailto:${order.vendor.email}`}
                className="ml-2 text-blue-600 hover:underline"
              >
                {order.vendor.email}
              </a>
            </div>
          )}
          {order.vendor.phone && (
            <div>
              <span className="text-neutral-600">Phone:</span>
              <a
                href={`tel:${order.vendor.phone}`}
                className="ml-2 text-blue-600 hover:underline"
              >
                {order.vendor.phone}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* PO Lines */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Order Lines</h2>
        </div>
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                Item
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                Description
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                Qty Ordered
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                Qty Received
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                Unit Cost
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                Line Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {order.lines.map((line) => {
              const received = Number(line.quantityReceived);
              const ordered = Number(line.quantityOrdered);
              const percentReceived = ordered > 0 ? (received / ordered) * 100 : 0;
              return (
                <tr key={line.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900">{line.vendorItemNumber}</div>
                    {line.inventoryItem && (
                      <div className="text-xs text-neutral-600 mt-1">
                        {line.inventoryItem.sku} • {line.inventoryItem.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    {line.description || "—"}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900">
                    {ordered.toFixed(2)}
                    {line.inventoryItem?.unitType && ` ${line.inventoryItem.unitType}`}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-medium text-neutral-900">
                      {received.toFixed(2)}
                      {line.inventoryItem?.unitType && ` ${line.inventoryItem.unitType}`}
                    </div>
                    {ordered > 0 && (
                      <div className="mt-1 w-20 ml-auto h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            percentReceived === 100
                              ? "bg-emerald-500"
                              : percentReceived > 0
                                ? "bg-amber-500"
                                : "bg-neutral-300"
                          }`}
                          style={{ width: `${Math.min(percentReceived, 100)}%` }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-neutral-700">
                    ${Number(line.unitCost).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-neutral-900">
                    ${(line.lineTotal / 100).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-neutral-50 border-t-2 border-neutral-300">
            <tr>
              <td colSpan={5} className="px-6 py-4 text-right text-sm font-semibold text-neutral-700">
                Total:
              </td>
              <td className="px-6 py-4 text-right text-lg font-bold text-neutral-900">
                ${(order.totalAmount / 100).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">Notes</h2>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      {/* Receive modal */}
      {showReceive && (
        <ReceiveModal
          lines={order.lines}
          onClose={() => setShowReceive(false)}
          onReceive={handleReceive}
          loading={receiving}
        />
      )}
    </div>
  );
}

function ReceiveModal({
  lines,
  onClose,
  onReceive,
  loading,
}: {
  lines: PurchaseOrderLine[];
  onClose: () => void;
  onReceive: (receivedLines: Array<{ lineId: string; quantityReceived: number; costPerUnit?: number }>) => void;
  loading: boolean;
}) {
  const pendingLines = lines.filter(
    (line) => Number(line.quantityReceived) < Number(line.quantityOrdered)
  );

  // Initialize received state with default values (remaining quantity for each line)
  // This ensures the state is populated even if user doesn't modify the pre-filled values
  const [received, setReceived] = useState<Record<string, { qty: number; cost?: number }>>(() => {
    const initial: Record<string, { qty: number; cost?: number }> = {};
    const pending = lines.filter(
      (line) => Number(line.quantityReceived) < Number(line.quantityOrdered)
    );
    for (const line of pending) {
      const ordered = Number(line.quantityOrdered);
      const alreadyReceived = Number(line.quantityReceived);
      const remaining = ordered - alreadyReceived;
      initial[line.id] = {
        qty: remaining,
        cost: line.unitCost ? Number(line.unitCost) : undefined,
      };
    }
    return initial;
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const receivedLines = Object.entries(received)
      .filter(([_, data]) => data.qty > 0)
      .map(([lineId, data]) => ({
        lineId,
        quantityReceived: data.qty,
        costPerUnit: data.cost,
      }));
    if (receivedLines.length === 0) {
      alert("Please enter quantities to receive");
      return;
    }
    onReceive(receivedLines);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">Receive Items</h2>
          <p className="text-sm text-neutral-600 mt-1">Enter quantities received for each line</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {pendingLines.map((line) => {
            const ordered = Number(line.quantityOrdered);
            const alreadyReceived = Number(line.quantityReceived);
            const remaining = ordered - alreadyReceived;
            // Use state value if it exists, otherwise use default (remaining quantity)
            const current = received[line.id] || { 
              qty: remaining, 
              cost: line.unitCost ? Number(line.unitCost) : undefined 
            };
            return (
              <div key={line.id} className="border border-neutral-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-neutral-900">{line.vendorItemNumber}</div>
                    {line.description && (
                      <div className="text-sm text-neutral-600 mt-1">{line.description}</div>
                    )}
                  </div>
                  <div className="text-right text-sm text-neutral-600">
                    <div>
                      Ordered: {ordered.toFixed(2)}
                      {line.inventoryItem?.unitType && ` ${line.inventoryItem.unitType}`}
                    </div>
                    <div>
                      Already received: {alreadyReceived.toFixed(2)}
                      {line.inventoryItem?.unitType && ` ${line.inventoryItem.unitType}`}
                    </div>
                    <div className="font-medium text-neutral-900 mt-1">
                      Remaining: {remaining.toFixed(2)}
                      {line.inventoryItem?.unitType && ` ${line.inventoryItem.unitType}`}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Quantity to Receive
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={remaining}
                      value={current.qty}
                      onChange={(e) =>
                        setReceived({
                          ...received,
                          [line.id]: { ...current, qty: Number(e.target.value) || 0 },
                        })
                      }
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Cost per Unit (optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={current.cost || ""}
                      onChange={(e) =>
                        setReceived({
                          ...received,
                          [line.id]: { ...current, cost: Number(e.target.value) || undefined },
                        })
                      }
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Receiving..." : "Receive Items"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
