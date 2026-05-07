"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserRole } from "@/hooks/useUserRole";

interface InventoryLot {
  id: string;
  quantity: number;
  costPerUnit: number | null;
  receivedAt: string;
  notes: string | null;
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitType: string;
  quantityOnHand: number;
  reorderPoint: number;
  reorderQty: number;
  locationNote: string | null;
  vendorItem: {
    id: string;
    itemNumber: string;
    vendor: { name: string; code: string };
  } | null;
  lots: InventoryLot[];
  averageCost?: number;
  totalInventoryValue?: number;
}

export default function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { isAdmin } = useUserRole();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unitType: "",
    reorderPoint: 0,
    reorderQty: 0,
    locationNote: "",
  });

  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (id) loadItem();
  }, [id]);

  async function loadItem() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/staff/api/inventory/${id}`);
      if (!res.ok) throw new Error("Failed to load inventory item");
      const data = await res.json();
      setItem(data.item);
      setFormData({
        name: data.item.name || "",
        category: data.item.category || "",
        unitType: data.item.unitType || "",
        reorderPoint: Number(data.item.reorderPoint) || 0,
        reorderQty: Number(data.item.reorderQty) || 0,
        locationNote: data.item.locationNote || "",
      });
    } catch (e: any) {
      setError(e.message || "Failed to load inventory item");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!id || !item) return;
    setSaving(true);
    try {
      const res = await fetch(`/staff/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      const data = await res.json();
      setItem(data.item);
      setEditing(false);
      alert("Inventory item updated!");
    } catch (e: any) {
      alert(e.message || "Failed to save");
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

  if (error || !item) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error || "Inventory item not found"}
        </div>
        <Link href="/staff/inventory" className="mt-4 inline-block text-sm text-neutral-600 hover:text-neutral-900">
          ← Back to Inventory
        </Link>
      </div>
    );
  }

  const isLowStock = Number(item.quantityOnHand) <= Number(item.reorderPoint);

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/staff/inventory" className="text-sm text-neutral-600 hover:text-neutral-900">
          ← Back to Inventory
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{item.name}</h1>
            <p className="text-neutral-600 text-sm mt-1">
              SKU: <span className="font-mono">{item.sku}</span> • Category: {item.category}
            </p>
          </div>
          {isLowStock && (
            <div className="rounded-lg bg-red-50 border border-red-300 px-4 py-2">
              <p className="text-sm font-semibold text-red-700">⚠️ Low Stock</p>
            </div>
          )}
        </div>
      </div>

      {/* Item Details */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Details</h2>
          {isAdmin && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
            >
              Edit
            </button>
          )}
          {editing && (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Unit Type</label>
                <input
                  type="text"
                  value={formData.unitType}
                  onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Reorder Point</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.reorderPoint}
                  onChange={(e) => setFormData({ ...formData, reorderPoint: Number(e.target.value) })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Reorder Quantity</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.reorderQty}
                  onChange={(e) => setFormData({ ...formData, reorderQty: Number(e.target.value) })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Location Note</label>
              <textarea
                value={formData.locationNote}
                onChange={(e) => setFormData({ ...formData, locationNote: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-neutral-600">Quantity On Hand</p>
              <p className="text-2xl font-bold text-neutral-900">
                {Number(item.quantityOnHand).toFixed(2)} {item.unitType}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Reorder Point</p>
              <p className="text-xl text-neutral-900">{Number(item.reorderPoint).toFixed(2)} {item.unitType}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Reorder Quantity</p>
              <p className="text-xl text-neutral-900">{Number(item.reorderQty).toFixed(2)} {item.unitType}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Average Cost per Unit</p>
              <p className="text-xl text-neutral-900">
                {item.averageCost && item.averageCost > 0 ? `$${item.averageCost.toFixed(2)}` : "—"}
              </p>
            </div>
          </div>
        )}

        {!editing && item.locationNote && (
          <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-200">
            <p className="text-xs font-semibold text-neutral-700 mb-2">Location Note</p>
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{item.locationNote}</p>
          </div>
        )}
      </div>

      {/* Vendor Info */}
      {item.vendorItem && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Vendor Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-600">Vendor:</span>
              <span className="ml-2 font-medium text-neutral-900">{item.vendorItem.vendor.name}</span>
            </div>
            <div>
              <span className="text-neutral-600">Vendor Code:</span>
              <span className="ml-2 font-mono text-neutral-900">{item.vendorItem.vendor.code}</span>
            </div>
            <div className="col-span-2">
              <span className="text-neutral-600">Vendor Item Number:</span>
              <span className="ml-2 font-mono text-neutral-900">{item.vendorItem.itemNumber}</span>
            </div>
          </div>
        </div>
      )}

      {/* Lot History */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Lot History</h2>
        </div>
        {item.lots && item.lots.length > 0 ? (
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                  Received
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                  Quantity
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                  Cost per Unit
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {item.lots.map((lot) => (
                <tr key={lot.id}>
                  <td className="px-6 py-3 text-sm text-neutral-900">
                    {new Date(lot.receivedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-medium text-neutral-900">
                    {Number(lot.quantity).toFixed(2)} {item.unitType}
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-neutral-700">
                    {lot.costPerUnit ? `$${Number(lot.costPerUnit).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-6 py-3 text-sm text-neutral-600">
                    {lot.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-neutral-600">No lot history</div>
        )}
      </div>
    </div>
  );
}
