"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MaterialItem {
  vendorItemId: string | null;
  vendorItemNumber: string;
  description: string;
  unitType: string;
  quantityNeeded: number;
  quantityOnHand: number;
  shortfall: number;
  needsOrdering: boolean;
  inventoryItemId: string | null;
  orders: Array<{ orderNumber: string; quantity: number }>;
}

interface VendorGroup {
  vendor: { id: string; name: string; code: string };
  items: MaterialItem[];
}

interface MaterialsData {
  vendors: VendorGroup[];
  summary: {
    totalVendors: number;
    totalItems: number;
    totalNeeded: number;
    totalOnHand: number;
    totalShortfall: number;
  };
}

export default function MaterialsNeededPage() {
  const router = useRouter();
  const [data, setData] = useState<MaterialsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  async function loadMaterials() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/staff/api/materials-needed");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to load materials needed" }));
        throw new Error(errorData.error || "Failed to load materials needed");
      }
      const data = await res.json();
      setData(data);
    } catch (e: any) {
      setError(e.message || "Failed to load materials needed");
    } finally {
      setLoading(false);
    }
  }

  async function generatePO(vendorId: string, items: MaterialItem[]) {
    setGenerating(vendorId);
    try {
      const res = await fetch("/staff/api/materials-needed/generate-po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          items: items.filter((i) => i.needsOrdering),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate PO");
      }

      const poData = await res.json();
      router.push(`/staff/purchase-orders/${poData.order.id}`);
    } catch (e: any) {
      alert(e.message || "Failed to generate purchase order");
    } finally {
      setGenerating(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-neutral-600">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error || "Failed to load materials needed"}
        </div>
        <button
          onClick={loadMaterials}
          className="mt-4 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Retry
        </button>
      </div>
    );
  }

  const vendorsWithNeeds = data.vendors.filter((v) =>
    v.items.some((i) => i.needsOrdering)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Materials Needed</h1>
          <p className="text-neutral-600 text-sm mt-1">
            Materials required for incomplete orders, grouped by vendor
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/staff/pricing/vendors"
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Manage Vendors
          </Link>
          <Link
            href="/staff/pricing/vendors"
            className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
          >
            + Add Vendor
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-600 uppercase mb-1">Vendors</div>
          <div className="text-2xl font-bold text-neutral-900">{data.summary.totalVendors}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-600 uppercase mb-1">Items</div>
          <div className="text-2xl font-bold text-neutral-900">{data.summary.totalItems}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-600 uppercase mb-1">Total Needed</div>
          <div className="text-2xl font-bold text-neutral-900">
            {data.summary.totalNeeded.toFixed(2)}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs text-amber-700 uppercase mb-1">Shortfall</div>
          <div className="text-2xl font-bold text-amber-900">
            {data.summary.totalShortfall.toFixed(2)}
          </div>
        </div>
      </div>

      {data.vendors.length === 0 ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-12 text-center">
          <p className="text-neutral-700 font-medium mb-2">No materials needed yet</p>
          <p className="text-sm text-neutral-600 mb-4">
            This page shows materials needed for incomplete orders. Once you create orders with components that use vendor items, they will appear here.
          </p>
          <div className="flex gap-2 justify-center">
            <Link
              href="/staff/orders/new"
              className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
            >
              Create an Order
            </Link>
            <Link
              href="/staff/pricing/vendors"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Manage Vendors
            </Link>
          </div>
        </div>
      ) : vendorsWithNeeds.length === 0 ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-12 text-center">
          <p className="text-green-800 font-medium mb-2">All materials are in stock!</p>
          <p className="text-sm text-green-700">No purchase orders needed at this time.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {vendorsWithNeeds.map((vendorGroup) => {
            const itemsNeedingOrder = vendorGroup.items.filter((i) => i.needsOrdering);
            const totalShortfall = itemsNeedingOrder.reduce((sum, i) => sum + i.shortfall, 0);

            return (
              <div key={vendorGroup.vendor.id} className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                <div className="p-6 border-b border-neutral-200 bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-neutral-900">{vendorGroup.vendor.name}</h2>
                      <p className="text-sm text-neutral-600 mt-1">
                        Code: <span className="font-mono">{vendorGroup.vendor.code}</span> •{" "}
                        {itemsNeedingOrder.length} item{itemsNeedingOrder.length !== 1 ? "s" : ""} need ordering
                      </p>
                    </div>
                    <button
                      onClick={() => generatePO(vendorGroup.vendor.id, vendorGroup.items)}
                      disabled={generating === vendorGroup.vendor.id || itemsNeedingOrder.length === 0}
                      className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
                    >
                      {generating === vendorGroup.vendor.id
                        ? "Generating..."
                        : `Generate PO (${itemsNeedingOrder.length} items)`}
                    </button>
                  </div>
                </div>

                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                        Item
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                        Needed
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                        On Hand
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                        Shortfall
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-700 uppercase">
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {vendorGroup.items.map((item, idx) => (
                      <tr
                        key={idx}
                        className={item.needsOrdering ? "bg-amber-50/50" : "hover:bg-neutral-50"}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-neutral-900">{item.vendorItemNumber}</div>
                          {item.description && (
                            <div className="text-xs text-neutral-600 mt-1">{item.description}</div>
                          )}
                          <div className="text-xs text-neutral-500 mt-1">
                            Unit: {item.unitType}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900">
                          {item.quantityNeeded.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-neutral-700">
                          {item.quantityOnHand.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.needsOrdering ? (
                            <span className="text-sm font-semibold text-amber-700">
                              {item.shortfall.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-sm text-neutral-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {item.orders.slice(0, 3).map((order, oIdx) => (
                              <Link
                                key={oIdx}
                                href={`/staff/orders?search=${order.orderNumber}`}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                {order.orderNumber}
                              </Link>
                            ))}
                            {item.orders.length > 3 && (
                              <span className="text-xs text-neutral-500">
                                +{item.orders.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
