"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BarcodeScanner from "@/components/BarcodeScanner";
import { useUserRole } from "@/hooks/useUserRole";

type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitType: string;
  quantityOnHand: number;
  reorderPoint: number;
  reorderQty: number;
  locationNote: string | null;
  averageCost?: number;
  totalInventoryValue?: number;
  vendorItem: {
    id: string;
    itemNumber: string;
    vendor: { name: string; code: string };
  } | null;
};

export default function InventoryPage() {
  const { isAdmin } = useUserRole();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append("category", filterCategory);
      if (showLowStock) params.append("lowStock", "true");

      const res = await fetch(`/staff/api/inventory?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load inventory");

      const data = await res.json();
      setItems(data.items || []);
    } catch (e: any) {
      setError(e.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, showLowStock]);

  const categories = Array.from(new Set(items.map((i) => i.category))).sort();

  const lowStockItems = items.filter(
    (item) => Number(item.quantityOnHand) <= Number(item.reorderPoint)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        {isAdmin && (
          <Link
            href="/staff/inventory/new"
            className="rounded-xl bg-black px-4 py-2 text-white hover:bg-neutral-800"
          >
            + Add Item
          </Link>
        )}
      </div>

      {/* Barcode Scanner */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">Barcode Scanner</h2>
        <BarcodeScanner />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
            <select
              className="w-full rounded-xl border p-2"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="lowStock"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="lowStock" className="text-sm text-neutral-700">
              Show low stock only
            </label>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {!showLowStock && lowStockItems.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-amber-900">⚠️ Low Stock Alert</div>
              <div className="text-sm text-amber-700">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""} below reorder point
              </div>
            </div>
            <button
              onClick={() => setShowLowStock(true)}
              className="text-sm px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700"
            >
              View All
            </button>
          </div>
        </div>
      )}

      {/* Inventory List */}
      {loading ? (
        <div className="text-center py-12 text-neutral-500">Loading...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">No inventory items found</div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Name</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Category</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-700">On Hand</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-700">Reorder Point</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-700">Avg Cost</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-700">Total Value</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Vendor</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {items.map((item) => {
                const isLowStock = Number(item.quantityOnHand) <= Number(item.reorderPoint);
                return (
                  <tr
                    key={item.id}
                    className={isLowStock ? "bg-red-50" : ""}
                  >
                    <td className="px-4 py-3 font-mono text-sm">{item.sku}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.name}</div>
                      {item.locationNote && (
                        <div className="text-xs text-neutral-500">{item.locationNote}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize">{item.category}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={isLowStock ? "font-semibold text-red-700" : ""}>
                        {Number(item.quantityOnHand).toFixed(2)} {item.unitType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {Number(item.reorderPoint).toFixed(2)} {item.unitType}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {item.averageCost && item.averageCost > 0 ? (
                        <span className="text-neutral-700">
                          ${item.averageCost.toFixed(2)}/{item.unitType}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      {item.totalInventoryValue && item.totalInventoryValue > 0 ? (
                        <span className="text-neutral-900">
                          ${item.totalInventoryValue.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.vendorItem ? (
                        <div className="text-sm">
                          <div>{item.vendorItem.vendor.code}</div>
                          <div className="text-xs text-neutral-500">{item.vendorItem.itemNumber}</div>
                        </div>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/staff/inventory/${item.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
