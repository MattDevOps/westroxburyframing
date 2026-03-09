"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Vendor {
  id: string;
  name: string;
  code: string;
}

interface VendorCatalogItem {
  id: string;
  itemNumber: string;
  description: string | null;
  category: string;
  unitType: string;
}

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorItems, setVendorItems] = useState<VendorCatalogItem[]>([]);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "moulding",
    unitType: "foot",
    vendorId: "",
    vendorItemId: "",
    quantityOnHand: "",
    reorderPoint: "",
    reorderQty: "",
    locationNote: "",
  });
  const [autoSku, setAutoSku] = useState<string | null>(null);

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    if (formData.vendorId) {
      loadVendorItems(formData.vendorId);
    } else {
      setVendorItems([]);
    }
  }, [formData.vendorId]);

  async function loadVendors() {
    try {
      const res = await fetch("/staff/api/vendors");
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors || []);
      }
    } catch (e) {
      console.error("Error loading vendors:", e);
    }
  }

  async function loadVendorItems(vendorId: string) {
    try {
      const res = await fetch(`/staff/api/vendors/${vendorId}/catalog`);
      if (res.ok) {
        const data = await res.json();
        setVendorItems(data.items || []);
      }
    } catch (e) {
      console.error("Error loading vendor items:", e);
    }
  }

  function handleVendorItemChange(itemId: string) {
    const item = vendorItems.find((i) => i.id === itemId);
    if (item) {
      const selectedVendor = vendors.find((v) => v.id === formData.vendorId);
      // Auto-generate SKU from vendor code + item number (same as PO system)
      if (selectedVendor && item.itemNumber) {
        const generatedSku = `${selectedVendor.code}-${item.itemNumber}`.toUpperCase().replace(/[^A-Z0-9-]/g, '-');
        setAutoSku(generatedSku);
        setFormData({
          ...formData,
          vendorItemId: itemId,
          name: item.description || item.itemNumber,
          category: item.category,
          unitType: item.unitType,
          sku: generatedSku, // Auto-fill SKU
        });
      } else {
        setAutoSku(null);
        setFormData({
          ...formData,
          vendorItemId: itemId,
          name: item.description || item.itemNumber,
          category: item.category,
          unitType: item.unitType,
        });
      }
    }
  }

  function handleVendorChange(vendorId: string) {
    setFormData({ ...formData, vendorId, vendorItemId: "", sku: "" });
    setAutoSku(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/staff/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: formData.sku,
          name: formData.name,
          category: formData.category,
          unitType: formData.unitType,
          vendorItemId: formData.vendorItemId || null,
          vendorId: formData.vendorId || null,
          quantityOnHand: formData.quantityOnHand ? parseFloat(formData.quantityOnHand) : 0,
          reorderPoint: formData.reorderPoint ? parseFloat(formData.reorderPoint) : 0,
          reorderQty: formData.reorderQty ? parseFloat(formData.reorderQty) : 0,
          locationNote: formData.locationNote || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create inventory item");
      }

      router.push("/staff/inventory");
    } catch (e: any) {
      setError(e.message || "Failed to create inventory item");
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    "moulding",
    "matboard",
    "glass",
    "mounting",
    "hardware",
    "backing",
    "other",
  ];

  const unitTypes = ["foot", "sheet", "each", "sqft"];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Add Inventory Item</h1>
        <p className="text-sm text-neutral-600">Create a new inventory item for tracking materials</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                SKU <span className="text-red-500">*</span>
                {autoSku && <span className="text-xs text-neutral-500 ml-2">(Auto-generated from vendor item)</span>}
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={autoSku || "VENDOR-ITEMNUM or INV-001"}
                disabled={!!autoSku}
              />
              {autoSku && (
                <p className="text-xs text-neutral-500 mt-1">
                  SKU auto-generated from vendor code and item number. Select a vendor item to auto-fill.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Item name..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Unit Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.unitType}
                onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {unitTypes.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Vendor
              </label>
              <select
                value={formData.vendorId}
                onChange={(e) => handleVendorChange(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.vendorId && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Vendor Catalog Item <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <select
                value={formData.vendorItemId}
                onChange={(e) => handleVendorItemChange(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select vendor item...</option>
                {vendorItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.itemNumber} - {item.description || "No description"}
                  </option>
                ))}
              </select>
              {vendorItems.length === 0 ? (
                <p className="text-xs text-neutral-500 mt-1">
                  No catalog items for this vendor yet. You can still create the inventory item manually, or catalog items will be auto-created when you receive purchase orders.
                </p>
              ) : (
                <p className="text-xs text-neutral-500 mt-1">
                  Selecting a vendor item will auto-fill name, category, unit type, and SKU. This links your inventory to the vendor's catalog.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Quantity on Hand
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantityOnHand}
                onChange={(e) => setFormData({ ...formData, quantityOnHand: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Reorder Point
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.reorderPoint}
                onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Reorder Quantity
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.reorderQty}
                onChange={(e) => setFormData({ ...formData, reorderQty: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Location Note
            </label>
            <input
              type="text"
              value={formData.locationNote}
              onChange={(e) => setFormData({ ...formData, locationNote: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 'Back room, shelf A'"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-black px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Inventory Item"}
          </button>
          <Link
            href="/staff/inventory"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
