"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Vendor {
  id: string;
  name: string;
  code: string;
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  unitType: string;
  vendorItemId: string | null;
  vendorItem: { 
    id: string;
    itemNumber: string; 
    vendor: { 
      name: string;
      code: string;
    } 
  } | null;
}

interface POLine {
  id?: string;
  inventoryItemId: string | null;
  vendorItemNumber: string;
  description: string;
  quantityOrdered: number;
  unitCost: number;
  notes: string;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vendorId, setVendorId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [lines, setLines] = useState<POLine[]>([
    {
      inventoryItemId: null,
      vendorItemNumber: "",
      description: "",
      quantityOrdered: 0,
      unitCost: 0,
      notes: "",
    },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [vendorsRes, inventoryRes] = await Promise.all([
        fetch("/staff/api/vendors"),
        fetch("/staff/api/inventory"),
      ]);

      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        setVendors(vendorsData.vendors || []);
      }

      if (inventoryRes.ok) {
        const inventoryData = await inventoryRes.json();
        setInventoryItems(inventoryData.items || []);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function addLine() {
    setLines([
      ...lines,
      {
        inventoryItemId: null,
        vendorItemNumber: "",
        description: "",
        quantityOrdered: 0,
        unitCost: 0,
        notes: "",
      },
    ]);
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index));
  }

  function updateLine(index: number, updates: Partial<POLine>) {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], ...updates };
    setLines(newLines);
  }

  // When inventory item is selected, auto-fill vendor item number if available
  function handleInventoryItemChange(index: number, itemId: string | null) {
    const item = inventoryItems.find((i) => i.id === itemId);
    const line = lines[index];
    let vendorItemNumber = line.vendorItemNumber;
    let description = line.description;

    if (item) {
      // Use itemNumber from vendorItem (API returns itemNumber, not vendorItemNumber)
      if (item.vendorItem?.itemNumber) {
        vendorItemNumber = item.vendorItem.itemNumber;
      }
      if (!description) {
        description = item.name;
      }
      // Try to get cost from vendor item (if available in the response)
      // Note: The API doesn't return costPerUnit/retailPerUnit in the inventory list
      // So we'll just update the basic fields
    }

    updateLine(index, {
      inventoryItemId: itemId,
      vendorItemNumber,
      description,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorId) {
      alert("Please select a vendor");
      return;
    }

    const validLines = lines.filter(
      (line) => line.vendorItemNumber && line.quantityOrdered > 0 && line.unitCost > 0
    );

    if (validLines.length === 0) {
      alert("Please add at least one valid line item");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/staff/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          notes: notes || null,
          lines: validLines.map((line) => ({
            inventoryItemId: line.inventoryItemId || null,
            vendorItemNumber: line.vendorItemNumber,
            description: line.description || null,
            quantityOrdered: Number(line.quantityOrdered),
            unitCost: Number(line.unitCost),
            notes: line.notes || null,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create purchase order");
      }

      const data = await res.json();
      router.push(`/staff/purchase-orders/${data.order.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create purchase order");
    } finally {
      setSaving(false);
    }
  }

  const selectedVendor = vendors.find((v) => v.id === vendorId);
  // Show all inventory items, but prioritize items matching the selected vendor
  // This allows linking any inventory item to a PO line, even if vendor doesn't match
  // The system will auto-link or create inventory items when receiving the PO anyway
  const vendorInventoryItems = inventoryItems.sort((a, b) => {
    // If vendor is selected, prioritize items that match the vendor
    if (selectedVendor) {
      const aMatches = a.vendorItem?.vendor.code === selectedVendor.code;
      const bMatches = b.vendorItem?.vendor.code === selectedVendor.code;
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
    }
    // Otherwise sort by name
    return a.name.localeCompare(b.name);
  });

  const totalAmount = lines.reduce(
    (sum, line) => sum + Number(line.quantityOrdered) * Number(line.unitCost) * 100,
    0
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-neutral-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/staff/purchase-orders" className="text-sm text-neutral-600 hover:text-neutral-900">
          ← Back to Purchase Orders
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900 mt-2">New Purchase Order</h1>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor selection */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Vendor</h2>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm"
            required
          >
            <option value="">Select a vendor...</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name} ({vendor.code})
              </option>
            ))}
          </select>
        </div>

        {/* PO Lines */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Order Lines</h2>
            <button
              type="button"
              onClick={addLine}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              + Add Line
            </button>
          </div>

          <div className="space-y-4">
            {lines.map((line, index) => (
              <div key={index} className="border border-neutral-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">Line {index + 1}</span>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Inventory Item (optional)
                    </label>
                    <select
                      value={line.inventoryItemId || ""}
                      onChange={(e) => handleInventoryItemChange(index, e.target.value || null)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    >
                      <option value="">None</option>
                      {vendorInventoryItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.sku} - {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Vendor Item Number *
                    </label>
                    <input
                      type="text"
                      value={line.vendorItemNumber}
                      onChange={(e) => updateLine(index, { vendorItemNumber: e.target.value })}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => updateLine(index, { description: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.quantityOrdered || ""}
                      onChange={(e) =>
                        updateLine(index, { quantityOrdered: Number(e.target.value) || 0 })
                      }
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Unit Cost *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.unitCost || ""}
                      onChange={(e) =>
                        updateLine(index, { unitCost: Number(e.target.value) || 0 })
                      }
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Line Total
                    </label>
                    <div className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-900">
                      ${(Number(line.quantityOrdered) * Number(line.unitCost)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-end">
            <div className="text-right">
              <div className="text-sm text-neutral-600">Total Amount:</div>
              <div className="text-2xl font-bold text-neutral-900">
                ${(totalAmount / 100).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm"
            placeholder="Optional notes for this purchase order..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link
            href="/staff/purchase-orders"
            className="rounded-lg border border-neutral-300 px-6 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !vendorId}
            className="rounded-lg bg-black text-white px-6 py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Purchase Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
